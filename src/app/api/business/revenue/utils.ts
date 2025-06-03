import { generateLedgerEntryId, generateTransactionRef } from '../records/utils';
import Ledger from '@/models/Ledger';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import Revenue from '@/models/Revenue';

export const createRevenueRecord = async (revenueData: any) => {
    // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate a transaction reference if not provided
    const revenueRef = revenueData.transactionRef || generateTransactionRef('REV');
    
    // Create the revenue record
    const revenue = await Revenue.create([{
      ...revenueData,
      transactionRef: revenueRef
    }], { session });

    // Safely get revenue amount and currency
    const revenueAmount = revenue[0].revenueAmount?.amount || 0;
    const currency = revenue[0].revenueAmount?.currency || 'USD';

    // Create a ledger entry for the revenue recognition
    await Ledger.create([{
      entryId: generateLedgerEntryId(),
      transactionRef: revenueRef,
      entryDate: revenue[0].transactionDate,
      account: 'revenue',
      debit: 0,
      credit: revenueAmount,
      balance: 0, // Balance will be updated separately
      currency: currency,
      description: `Revenue: ${revenue[0].revenueType}`,
      metadata: {
        entryType: 'fee',
        notes: revenue[0].metadata?.description || 'Fee revenue'
      }
    }], { session });

    // If status is 'settled', create a ledger entry for settlement
    if (revenue[0].status === 'settled') {
      await Ledger.create([{
        entryId: generateLedgerEntryId(),
        transactionRef: revenueRef,
        entryDate: revenue[0].settlementDate || revenue[0].transactionDate,
        account: 'operating',
        debit: revenueAmount,
        credit: 0,
        balance: 0, // Balance will be updated separately
        currency: currency,
        description: 'Settlement of fee revenue',
        metadata: {
          entryType: 'settlement',
          notes: `Settlement from trust to operating account for ${revenueRef}`
        }
      }], { session });

      // Also update the original transaction fee status if provided
      if (revenue[0].associatedTransactionRef) {
        await Transaction.updateOne(
          { 
            transactionRef: revenue[0].associatedTransactionRef,
            'fees.feeType': revenue[0].revenueType
          },
          {
            $set: {
              'fees.$.revenueStatus': 'settled',
              'fees.$.settlementDate': revenue[0].settlementDate || revenue[0].transactionDate
            }
          },
          { session }
        );
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    return revenue[0];
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    console.error('Error recording revenue:', error);
    throw error;
  } finally {
    // End the session
    session.endSession();
  }
} 