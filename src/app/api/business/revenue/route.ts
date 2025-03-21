import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Revenue from '@/models/Revenue';
import { createRevenueRecord } from './utils';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const revenueData = await request.json();
        
        // Validate revenue data here if needed
        if (!revenueData.revenueAmount || !revenueData.associatedTransactionRef) {
            return NextResponse.json(
                { success: false, error: 'Missing required revenue fields' },
                { status: 400 }
            );
        }
        
        const revenue = await createRevenueRecord(revenueData);
        
        return NextResponse.json({
            success: true,
            data: revenue
        });
    } catch (error: any) {
        console.error('Error creating revenue record:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create revenue record' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const transactionRef = searchParams.get('transactionRef');
        const associatedTransactionRef = searchParams.get('associatedTransactionRef');
        
        if (transactionRef) {
            // Get a specific revenue record
            const revenue = await Revenue.findOne({ transactionRef }).lean();
            
            if (!revenue) {
                return NextResponse.json(
                    { success: false, error: 'Revenue record not found' },
                    { status: 404 }
                );
            }
            
            return NextResponse.json({
                success: true,
                data: revenue
            });
        } else {
            // Get a list of revenue records with optional filtering
            const limit = parseInt(searchParams.get('limit') || '20');
            const skip = parseInt(searchParams.get('skip') || '0');
            const status = searchParams.get('status');
            const revenueType = searchParams.get('revenueType');
            
            let query: any = {};
            if (status) query.status = status;
            if (revenueType) query.revenueType = revenueType;
            if (associatedTransactionRef) query.associatedTransactionRef = associatedTransactionRef;
            
            const revenues = await Revenue.find(query)
                .sort({ transactionDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
                
            const total = await Revenue.countDocuments(query);
            
            return NextResponse.json({
                success: true,
                data: {
                    revenues,
                    pagination: {
                        total,
                        limit,
                        skip
                    }
                }
            });
        }
    } catch (error: any) {
        console.error('Error retrieving revenue records:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to retrieve revenue records' },
            { status: 500 }
        );
    }
} 