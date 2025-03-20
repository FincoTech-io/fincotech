import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import FeeConfig from '@/models/FeeConfig';

// Get applicable fees for a transaction
export const getApplicableFees = async (transactionType: string, amount: number, walletTier: string, region: string) => {

    try {
        const currentDate = new Date();

        await connectToDatabase();

        const feeConfig = await FeeConfig.aggregate([
            {
                $match: {
                    transactionType: { $in: [transactionType, 'all'] },
                    isActive: true,
                    effectiveStartDate: { $lte: currentDate },
                    $or: [
                        { effectiveEndDate: { $gte: currentDate } },
                        { effectiveEndDate: null }
                    ]
                }
            },
            {
                $addFields: {
                    tierScore: {
                        $cond: {
                            if: { $in: [walletTier, '$applicableTiers'] },
                            then: 10,
                            else: { $cond: { if: { $in: ["ALL", "$applicableTiers"] }, then: 5, else: 0 } }
                        }
                    },
                    regionScore: {
                        $cond: {
                            if: { $in: [region, "$applicableRegions"] },
                            then: 10,
                            else: { $cond: { if: { $in: ["GLOBAL", "$applicableRegions"] }, then: 5, else: 0 } }
                        }
                    }
                }
            },
            // Match to ensure we only get configs that apply to this user's tier and region
            {
                $match: {
                    tierScore: { $gt: 0 },
                    regionScore: { $gt: 0 }
                }
            },
            // Sort by our calculated scores and date
            {
                $sort: {
                    // Higher scores first
                    tierScore: -1,
                    regionScore: -1,
                    // Newer configs first
                    effectiveStartDate: -1
                }
            }
        ])

        if (!feeConfig || feeConfig.length === 0) {
            // Return default fee configuration if none found
            return {
              feeType: 'transaction_fee',
              calculationType: 'fixed',
              fixedAmount: 1.00,
              currency: 'USD',
              description: 'Default transaction fee'
            };
        }
        return feeConfig[0];

    } catch (error) {
        console.error('Error fetching applicable fees:', error);
        throw new Error('Failed to fetch applicable fees');
    }
}

export const calculateFeeAmount = (feeConfig: any, transactionAmount: number) => {
    let feeAmount = 0;

  switch (feeConfig.calculationType) {
    case 'fixed':
      feeAmount = feeConfig.fixedAmount;
      break;
    
    case 'percentage':
      feeAmount = (transactionAmount * feeConfig.percentageRate) / 100;
      break;
    
    case 'tiered':
      // Find the appropriate tier based on transaction amount
      const tier = feeConfig.tieredRates.find(
          (tier: { minAmount: number; maxAmount: number; }) => transactionAmount >= tier.minAmount && transactionAmount <= tier.maxAmount
      );
      
      if (tier) {
        feeAmount = tier.fixedAmount + (transactionAmount * tier.percentageRate) / 100;
      } else {
        // Use the highest tier if amount exceeds all tiers
        const highestTier = feeConfig.tieredRates.sort((a: { maxAmount: number; }, b: { maxAmount: number; }) => b.maxAmount - a.maxAmount)[0];
        feeAmount = highestTier.fixedAmount + (transactionAmount * highestTier.percentageRate) / 100;
      }
      break;
    
    case 'hybrid':
      // Hybrid combines fixed and percentage
      feeAmount = feeConfig.fixedAmount + (transactionAmount * feeConfig.percentageRate) / 100;
      break;
    
    default:
      feeAmount = feeConfig.fixedAmount;
  }

  // Apply minimum and maximum fee constraints if defined
  if (feeConfig.minimumFee > 0 && feeAmount < feeConfig.minimumFee) {
    feeAmount = feeConfig.minimumFee;
  }
  
  if (feeConfig.maximumFee > 0 && feeAmount > feeConfig.maximumFee) {
    feeAmount = feeConfig.maximumFee;
  }

  // Round to 2 decimal places
  return Math.round(feeAmount * 100) / 100;
} 