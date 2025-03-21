import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Wallet, { IWallet } from '@/models/Wallet';
import { getApplicableFees, calculateFeeAmount } from '../../business/fees/utils';

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

        const wallet = await Wallet.findOne({ $or: [{ userId: walletIdentifier }, { address: walletIdentifier }] });

        if (!wallet) {
            return NextResponse.json(
                { success: false, error: 'Wallet not found' },
                { status: 404 }
            );
        }

        console.log(`🔍 DEBUG - Wallet found for user/address: ${walletIdentifier}`);
        console.log(`🔍 DEBUG - Raw wallet balance: ${wallet.balance} (${typeof wallet.balance})`);
        console.log(`🔍 DEBUG - User tier: ${wallet.tier}`);
        console.log(`🔍 DEBUG - Monthly transaction count: ${wallet.monthlyTransactionCount}`);
        
        if (!wallet.isActive) {
            return NextResponse.json(
                { success: false, error: 'Wallet is not active' },
                { status: 400 }
            );
        }

        // TODO: Get the region from the wallet
        const feeConfig = await getApplicableFees(transactionType, amount, wallet.tier, "GLOBAL");

        const feeAmount = calculateFeeAmount(feeConfig, amount);
        console.log(`🔍 DEBUG - Requested transfer amount: ${amount} (${typeof amount})`);
        console.log(`🔍 DEBUG - Calculated fee: ${feeAmount} (${typeof feeAmount})`);
        
        // Ensure all values are properly converted to numbers for comparison
        const numericBalance = Number(wallet.balance);
        const numericAmount = Number(amount);
        const numericFeeAmount = Number(feeAmount);
        const totalAmount = numericAmount + numericFeeAmount;
        
        console.log(`🔍 DEBUG - Converted balance: ${numericBalance} (${typeof numericBalance})`);
        console.log(`🔍 DEBUG - Converted amount: ${numericAmount} (${typeof numericAmount})`);
        console.log(`🔍 DEBUG - Converted fee: ${numericFeeAmount} (${typeof numericFeeAmount})`);
        console.log(`🔍 DEBUG - Total amount needed: ${totalAmount} (${typeof totalAmount})`);
        console.log(`🔍 DEBUG - Is balance sufficient: ${numericBalance >= totalAmount}`);

        // Add a small buffer (0.01) to handle potential rounding issues
        const ROUNDING_BUFFER = 0.01;
        
        if (numericBalance + ROUNDING_BUFFER < totalAmount) {
            console.log(`🚫 ERROR - Insufficient balance: required ${totalAmount}, available ${numericBalance}, difference ${totalAmount - numericBalance}`);
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