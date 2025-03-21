import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Revenue from '@/models/Revenue';
import Transaction from '@/models/Transaction';
import Ledger from '@/models/Ledger';
import mongoose from 'mongoose';
import { generateTransactionRef } from '../records/utils';
import { generateLedgerEntryId } from '../records/utils';

export async function POST(request: NextRequest) {
    // Start a database session for transaction integrity
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        await connectToDatabase();
        const { revenueIds, batchReference, settlementDate, notes } = await request.json();
        
        if (!revenueIds || !Array.isArray(revenueIds) || revenueIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No revenue IDs provided for settlement' },
                { status: 400 }
            );
        }
        
        // Generate a batch reference if not provided
        const settlementBatchRef = batchReference || `SETTLE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        // Find all pending revenue records with the given IDs
        const pendingRevenues = await Revenue.find({
            _id: { $in: revenueIds },
            status: 'pending'
        }).session(session);
        
        if (pendingRevenues.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid pending revenue records found' },
                { status: 404 }
            );
        }
        
        // Calculate total settlement amount
        let totalSettlementAmount = 0;
        const currency = pendingRevenues[0].revenueAmount.currency; // Assuming all in same currency
        
        // Update each revenue record to 'settled'
        for (const revenue of pendingRevenues) {
            totalSettlementAmount += revenue.revenueAmount.amount;
            
            // Update revenue record
            revenue.status = 'settled';
            revenue.settlementDate = settlementDate || new Date();
            if (!revenue.metadata) revenue.metadata = {};
            revenue.metadata.settlementBatch = settlementBatchRef;
            revenue.metadata.notes = notes || 'Settlement processed';
            
            await revenue.save({ session });
            
            // Create ledger entry for settlement
            await Ledger.create([{
                entryId: generateLedgerEntryId(),
                transactionRef: revenue.transactionRef,
                entryDate: settlementDate || new Date(),
                account: 'operating',
                debit: revenue.revenueAmount.amount,
                credit: 0,
                balance: 0, // Balance will be updated separately
                currency: revenue.revenueAmount.currency,
                description: 'Settlement of fee revenue',
                metadata: {
                    entryType: 'settlement',
                    notes: `Settlement batch: ${settlementBatchRef}`,
                    settlementBatch: settlementBatchRef
                }
            }], { session });
            
            // Also update the original transaction fee status if possible
            if (revenue.associatedTransactionRef) {
                await Transaction.updateOne(
                    { 
                        transactionRef: revenue.associatedTransactionRef,
                        'fees.feeType': revenue.revenueType
                    },
                    {
                        $set: {
                            'fees.$.revenueStatus': 'settled',
                            'fees.$.settlementDate': settlementDate || new Date()
                        }
                    },
                    { session }
                );
            }
        }
        
        // Create a settlement transaction record
        const settlementTransactionRef = generateTransactionRef('SETTLE');
        
        // Commit the transaction
        await session.commitTransaction();
        
        return NextResponse.json({
            success: true,
            data: {
                settlementBatchRef,
                totalSettlementAmount,
                currency,
                settledCount: pendingRevenues.length,
                settlementDate: settlementDate || new Date()
            }
        });
    } catch (error: any) {
        // Abort the transaction on error
        await session.abortTransaction();
        console.error('Error processing settlement:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process settlement' },
            { status: 500 }
        );
    } finally {
        // End the session
        session.endSession();
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const batchRef = searchParams.get('batchRef');
        
        let query: any = {};
        
        if (batchRef) {
            query['metadata.settlementBatch'] = batchRef;
        } else {
            query.status = 'settled';
        }
        
        // Group settled revenues by batch
        const settledRevenues = await Revenue.aggregate([
            { $match: query },
            { 
                $group: {
                    _id: '$metadata.settlementBatch',
                    batchRef: { $first: '$metadata.settlementBatch' },
                    settlementDate: { $first: '$settlementDate' },
                    totalAmount: { $sum: '$revenueAmount.amount' },
                    currency: { $first: '$revenueAmount.currency' },
                    count: { $sum: 1 },
                    revenues: { $push: { id: '$_id', amount: '$revenueAmount.amount', type: '$revenueType' } }
                }
            },
            { $sort: { settlementDate: -1 } }
        ]);
        
        return NextResponse.json({
            success: true,
            data: settledRevenues
        });
    } catch (error: any) {
        console.error('Error retrieving settlements:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to retrieve settlements' },
            { status: 500 }
        );
    }
} 