import { format } from 'date-fns';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Transaction from '@/models/Transaction';
import Ledger from '@/models/Ledger';

export const generateTransactionRef = (prefix = 'TRX') => {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${randomString}`;
}

export const generateLedgerEntryId = () => {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `LEDGER-${timestamp}-${randomString}`;
}

export const createTransactionRecord = async (transactionData: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Generate a transaction reference if not provided
        const transactionRef = transactionData.transactionRef || generateTransactionRef();
        
        // Create the transaction
        const transaction = await Transaction.create([{
          ...transactionData,
          transactionRef,
          reference: transactionRef  // Add reference field to satisfy existing index
        }], { session });
    
        // Create ledger entries
        if (transaction[0].fees && transaction[0].fees.length > 0) {
          // Calculate total fee amount
          const totalFeeAmount = transaction[0].fees.reduce(
            (sum: number, fee: any) => sum + fee.feeAmount, 
            0
          );
    
          // Create a ledger entry for the transaction
          await Ledger.create([{
            entryId: generateLedgerEntryId(),
            transactionRef,
            entryDate: transaction[0].transactionDate,
            account: 'customer',
            debit: transaction[0].transferAmount.amount,
            credit: 0,
            balance: 0, // Balance will be updated separately
            currency: transaction[0].transferAmount.currency,
            description: `Transaction: ${transaction[0].transactionType}`,
            metadata: {
              entryType: 'transfer',
              notes: `Transfer from ${transaction[0].sender.name} to ${transaction[0].recipient.name}`
            }
          }], { session });
    
          // Create a ledger entry for the fee
          await Ledger.create([{
            entryId: generateLedgerEntryId(),
            transactionRef,
            entryDate: transaction[0].transactionDate,
            account: 'revenue',
            debit: 0,
            credit: totalFeeAmount,
            balance: 0, // Balance will be updated separately
            currency: transaction[0].transferAmount.currency,
            description: `Fee collected for transaction: ${transaction[0].transactionType}`,
            metadata: {
              entryType: 'fee',
              notes: `Fee for transfer from ${transaction[0].sender.name} to ${transaction[0].recipient.name}`
            }
          }], { session });
        }
    
        // Commit the transaction
        await session.commitTransaction();
        return transaction[0];
      } catch (error) {
        // Abort the transaction on error
        await session.abortTransaction();
        console.error('Error creating transaction:', error);
        throw error;
      } finally {
        // End the session
        session.endSession();
      }
} 