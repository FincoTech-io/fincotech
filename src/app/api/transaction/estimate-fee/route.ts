import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getApplicableFees, calculateFeeAmount } from '../../business/fees/utils';
import Wallet from '@/models/Wallet';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { amount, transactionType, userId, region } = await request.json();
        
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json(
                { success: false, error: 'Valid transaction amount is required' },
                { status: 400 }
            );
        }
        
        // Use default values if not provided
        const type = transactionType || 'transfer';
        const userRegion = region || 'GLOBAL';
        
        let walletTier = 'STANDARD'; // Default tier
        
        // If userId is provided, get actual wallet tier
        if (userId) {
            const wallet = await Wallet.findOne({ userId }).lean();
            if (wallet) {
                walletTier = wallet.tier;
            }
        }
        
        // Get fee configuration
        const feeConfig = await getApplicableFees(type, parseFloat(amount), walletTier, userRegion);
        
        // Calculate fee amount
        const feeAmount = calculateFeeAmount(feeConfig, parseFloat(amount));
        
        return NextResponse.json({
            success: true,
            data: {
                estimatedFee: feeAmount,
                totalAmount: parseFloat(amount) + feeAmount,
                feeDetails: {
                    feeType: feeConfig.feeType,
                    calculationType: feeConfig.calculationType,
                    description: feeConfig.description,
                    currency: feeConfig.currency || 'USD'
                }
            }
        });
    } catch (error: any) {
        console.error('Error estimating fees:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to estimate fees' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const amount = searchParams.get('amount');
        const transactionType = searchParams.get('transactionType') || 'transfer';
        const userId = searchParams.get('userId');
        const region = searchParams.get('region') || 'GLOBAL';
        
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            return NextResponse.json(
                { success: false, error: 'Valid transaction amount is required' },
                { status: 400 }
            );
        }
        
        let walletTier = 'STANDARD'; // Default tier
        
        // If userId is provided, get actual wallet tier
        if (userId) {
            const wallet = await Wallet.findOne({ userId }).lean();
            if (wallet) {
                walletTier = wallet.tier;
            }
        }
        
        // Get fee configuration
        const feeConfig = await getApplicableFees(transactionType, parseFloat(amount), walletTier, region);
        
        // Calculate fee amount
        const feeAmount = calculateFeeAmount(feeConfig, parseFloat(amount));
        
        return NextResponse.json({
            success: true,
            data: {
                estimatedFee: feeAmount,
                totalAmount: parseFloat(amount) + feeAmount,
                feeDetails: {
                    feeType: feeConfig.feeType,
                    calculationType: feeConfig.calculationType,
                    description: feeConfig.description,
                    currency: feeConfig.currency || 'USD'
                }
            }
        });
    } catch (error: any) {
        console.error('Error estimating fees:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to estimate fees' },
            { status: 500 }
        );
    }
} 