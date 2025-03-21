import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Transaction from '@/models/Transaction';
import { createTransactionRecord } from './utils';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const transactionData = await request.json();
        
        // Validate transaction data here if needed
        if (!transactionData.transactionType || !transactionData.transferAmount) {
            return NextResponse.json(
                { success: false, error: 'Missing required transaction fields' },
                { status: 400 }
            );
        }
        
        const transaction = await createTransactionRecord(transactionData);
        
        return NextResponse.json({
            success: true,
            data: transaction
        });
    } catch (error: any) {
        console.error('Error creating transaction record:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create transaction record' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const transactionRef = searchParams.get('transactionRef');
        
        if (transactionRef) {
            // Get a specific transaction
            const transaction = await Transaction.findOne({ transactionRef }).lean();
            
            if (!transaction) {
                return NextResponse.json(
                    { success: false, error: 'Transaction not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({
                success: true,
                data: transaction
            });
        } else {
            // Get a list of transactions with optional filtering
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = parseInt(searchParams.get('skip') || '0');
            const status = searchParams.get('status');
            const transactionType = searchParams.get('transactionType');
            
            let query: any = {};
            if (status) query.status = status;
            if (transactionType) query.transactionType = transactionType;
            
            const transactions = await Transaction.find(query)
                .sort({ transactionDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
                
            const total = await Transaction.countDocuments(query);
            
            return NextResponse.json({
                success: true,
                data: {
                    transactions,
                    pagination: {
                        total,
                        limit,
                        skip
                    }
                }
            });
        }
    } catch (error: any) {
        console.error('Error retrieving transactions:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to retrieve transactions' },
            { status: 500 }
        );
    }
} 