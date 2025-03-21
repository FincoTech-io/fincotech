import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Ledger from '@/models/Ledger';

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get('entryId');
        const transactionRef = searchParams.get('transactionRef');
        
        if (entryId) {
            // Get a specific ledger entry
            const ledgerEntry = await Ledger.findOne({ entryId }).lean();
            
            if (!ledgerEntry) {
                return NextResponse.json(
                    { success: false, error: 'Ledger entry not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({
                success: true,
                data: ledgerEntry
            });
        } else {
            // Get a list of ledger entries with optional filtering
            const limit = parseInt(searchParams.get('limit') || '50');
            const skip = parseInt(searchParams.get('skip') || '0');
            const account = searchParams.get('account');
            const entryType = searchParams.get('entryType');
            
            let query: any = {};
            if (account) query.account = account;
            if (entryType) query['metadata.entryType'] = entryType;
            if (transactionRef) query.transactionRef = transactionRef;
            
            const ledgerEntries = await Ledger.find(query)
                .sort({ entryDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
                
            const total = await Ledger.countDocuments(query);
            
            return NextResponse.json({
                success: true,
                data: {
                    ledgerEntries,
                    pagination: {
                        total,
                        limit,
                        skip
                    }
                }
            });
        }
    } catch (error: any) {
        console.error('Error retrieving ledger entries:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to retrieve ledger entries' },
            { status: 500 }
        );
    }
} 