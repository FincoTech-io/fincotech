import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Wallet, { IWallet } from '@/models/Wallet';
import { getApplicableFees, calculateFeeAmount } from '../../business/fees/route';

export async function POST(request: NextRequest) {

    return NextResponse.json(
        { success: true, message: 'Wallet conditions fetched successfully' },
        { status: 200 }
    );

}

const getTransactionLimits = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return { maxTransactions: 10, maxAmount: 500 };
      case 'STANDARD':
        return { maxTransactions: 50, maxAmount: 2000 };
      case 'PREMIUM':
        return { maxTransactions: 150, maxAmount: 10000 };
      case 'VIP':
        return { maxTransactions: 500, maxAmount: 50000 };
      default:
        return { maxTransactions: 50, maxAmount: 2000 }; // Default to STANDARD
    }
};

// Validate if the wallet is eligible for a transaction
export const walletConditions = async (walletIdentifier: string, amount: number, transactionType = 'transfer') => {
    try {
        await connectToDatabase();

        const wallet = await Wallet.findOne({ $or: [{ _id: walletIdentifier }, { walletAddress: walletIdentifier }] });

        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet not found' },
                { status: 404 }
            );
        }

        
        if (!wallet.isActive) {
            return NextResponse.json(
                { success: false, error: 'Wallet is not active' },
                { status: 400 }
            );
        }


        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // TODO: Get the region from the wallet
        const feeConfig = await getApplicableFees(transactionType, amount, wallet.tier, "GLOBAL");

        const feeAmount = calculateFeeAmount(feeConfig, amount);
        const totalAmount = amount + feeAmount;

        if (wallet.balance < totalAmount) {
            return NextResponse.json(
                { success: false, error: 'Insufficient balance to cover the transaction' },
                { status: 400 }
            );
        }

        const limits = getTransactionLimits(wallet.tier);

        if (wallet.monthlyTransactionCount >= limits.maxTransactions) {
            return NextResponse.json(
                { success: false, error: 'Monthly transaction limit reached' },
                { status: 400 }
            );
        }

        if (amount > limits.maxAmount) {
            return NextResponse.json(
                { success: false, error: 'Transaction amount exceeds the maximum allowed amount' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: true, 
                feeAmount,
                feeType: feeConfig.feeType,
                isValid: true,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(`Error validating transaction for user: ${walletIdentifier}`, error);
        return NextResponse.json(
            { 
                success: false,
                isValid: false, 
                error: 'Failed to validate transaction' 
            },
            { status: 500 }
        );
    }
}

