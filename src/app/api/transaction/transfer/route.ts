import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { jwtVerify } from 'jose';
import User, { IUser } from '@/models/User';
import Wallet, { IWallet } from '@/models/Wallet';
import Transaction from '@/models/Transaction';
import { walletConditions } from '@/app/api/wallet/condition/utils';
import mongoose from 'mongoose';
import { calculateFeeAmount, getApplicableFees } from '../../business/fees/utils';
import { generateTransactionRef, createTransactionRecord } from '../../business/records/utils';
import { createRevenueRecord } from '../../business/revenue/utils';
import { getAccessToken, verifyAccessToken  } from '@/utils/serverAuth';

export async function POST(request: NextRequest) {
    try {
        // Get token
        const token = getAccessToken(request);

        // If no token, return unauthorized
        if (!token) {
            return NextResponse.json({ 
                authenticated: false,
                message: 'No authentication token provided'
            }, { status: 401 });
        }
        try {
            // Verify the token
            const payload = await verifyAccessToken(token);

            // Extract userId from token payload
            const userId = payload?.userId as string;

            // Connect to database
            await connectToDatabase();

            const user = await User.findById(userId)
                .select('-pin -security')  // Exclude sensitive fields
                .lean()
                .exec();

            // If user not found
            if (!user) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'User not found'
                    },
                    { status: 404 }
                );
            }

            const { toUserId, toAddress, amount, description } = await request.json();

            // Determine which identifier to use (either userId or wallet address)
            const receiverIdentifier = toUserId || toAddress;

            if (!receiverIdentifier || !amount || !description) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Missing required fields: User ID or Address, Amount, or Description',
                        error: 'Invalid request'
                    },
                    { status: 400 }
                );
            }

            // Ensure amount is a number
            const numericAmount = parseFloat(amount);
            
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Amount must be a positive number',
                        error: 'Invalid amount'
                    },
                    { status: 400 }
                );
            }

            // Process the transaction using either address or ID
            return await processTransaction(userId, receiverIdentifier, numericAmount, description);

        } catch (error: any) {
            console.error('Error transferring funds:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: error.message || 'Failed to process transaction'
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error transferring funds:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to process transaction'
            },
            { status: 500 }
        );
    }
}

const processTransaction = async (userId: string, identifier: string, amount: number, description: string) => {
    try {
        // Ensure amount is a number
        amount = Number(amount);
        if (isNaN(amount)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid amount: must be a number'
            }, { status: 400 });
        }
        
        // We need to check the SENDER's wallet (userId) for sufficient funds
        const walletIsEligible = await walletConditions(userId, amount);
        
        // Extract the response data from the NextResponse object
        const walletResponse = await walletIsEligible.json();
        
        if (!walletResponse.isValid) {
            return NextResponse.json(
                { success: false, error: walletResponse.error },
                { status: 400 }
            );
        }
        
        let receiverId;
        
        // Check if this is a wallet address (bcrypt hash starts with $2b$)
        if (identifier.startsWith('$2b$') || identifier.length > 24) {
            // Looking up by wallet address
            const receiverWallet = await Wallet.findOne({ address: identifier });
            if (!receiverWallet) {
                return NextResponse.json({
                    success: false,
                    error: 'Receiver wallet not found with the provided address'
                }, { status: 404 });
            }
            // Use userId if available, otherwise use entityId for non-user entities
            receiverId = (receiverWallet.userId || receiverWallet.entityId)?.toString();
        } else {
            try {
                // Try to use as a MongoDB ObjectId
                receiverId = identifier;
                
                // Verify the recipient user exists
                const recipientUser = await User.findById(receiverId);
                if (!recipientUser) {
                    return NextResponse.json({
                        success: false,
                        error: 'Recipient user not found'
                    }, { status: 404 });
                }
                
                // Check if recipient has a wallet
                const recipientWallet = await Wallet.findOne({ userId: receiverId });
                if (!recipientWallet) {
                    return NextResponse.json({
                        success: false,
                        error: 'Recipient does not have a wallet'
                    }, { status: 404 });
                }
            } catch (error) {
                // If there's an error with ObjectId casting, try as wallet address again
                const receiverWallet = await Wallet.findOne({ address: identifier });
                if (!receiverWallet) {
                    return NextResponse.json({
                        success: false,
                        error: 'Invalid identifier: not a valid user ID or wallet address'
                    }, { status: 400 });
                }
                // Use userId if available, otherwise use entityId for non-user entities
                receiverId = (receiverWallet.userId || receiverWallet.entityId)?.toString();
            }
        }

        // Ensure sender != receiver
        if (userId === receiverId) {
            return NextResponse.json({
                success: false,
                error: 'You cannot transfer funds to yourself'
            }, { status: 400 });
        }

        const result = await transfer(userId, receiverId, amount, description);
        
        // Check if the result is a NextResponse object (error case)
        if (result instanceof NextResponse) {
            return result;
        }
        
        // Otherwise return the success result
        return NextResponse.json(
            { success: true, message: 'Transfer completed successfully', result },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error transferring funds:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to transfer funds'
        }, { status: 500 });
    }
}

const transfer = async (userId: string, receiverId: string, amount: number, description: string) => {

    const connection = await mongoose.startSession();
    connection.startTransaction();

    try {
        // Ensure amount is a number
        amount = Number(amount);
        if (isNaN(amount)) {
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Invalid amount: must be a number'
            }, { status: 400 });
        }
        
        console.log(`Transfer initiated: From user ${userId} to user ${receiverId}, amount: ${amount}`);
        
        if (amount <= 0) {
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Amount must be greater than 0'
            }, { status: 400 });
        }

        console.log(`Looking up sender wallet for user: ${userId}`);
        // Try multiple strategies to find the sender wallet
        let senderWallet = await Wallet.findOne({ userId: userId }).session(connection);
        if (!senderWallet) {
            // Try finding by entityType and entityId for merchants/drivers
            senderWallet = await Wallet.findOne({ 
                $or: [
                    { entityType: 'MERCHANT', entityId: userId },
                    { entityType: 'DRIVER', entityId: userId },
                    { entityType: 'USER', entityId: userId }
                ]
            }).session(connection);
        }
        
        console.log(`Looking up receiver wallet for user: ${receiverId}`);
        // Try multiple strategies to find the receiver wallet
        let receiverWallet = await Wallet.findOne({ userId: receiverId }).session(connection);
        if (!receiverWallet) {
            // Try finding by entityType and entityId for merchants/drivers
            receiverWallet = await Wallet.findOne({ 
                $or: [
                    { entityType: 'MERCHANT', entityId: receiverId },
                    { entityType: 'DRIVER', entityId: receiverId },
                    { entityType: 'USER', entityId: receiverId }
                ]
            }).session(connection);
        }

        if (!senderWallet) {
            console.log(`Sender wallet not found for user: ${userId}`);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Sender wallet not found'
            }, { status: 400 });
        }

        if (!receiverWallet) {
            console.log(`Receiver wallet not found for user: ${receiverId}`);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Wallet not found'
            }, { status: 400 });
        }
        
        // Ensure wallet balances are valid numbers
        if (isNaN(senderWallet.balance)) {
            console.error(`Sender wallet ${userId} has invalid balance: ${senderWallet.balance}`);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Invalid sender wallet balance'
            }, { status: 500 });
        }
        
        if (isNaN(receiverWallet.balance)) {
            console.error(`Receiver wallet ${receiverId} has invalid balance: ${receiverWallet.balance}`);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Invalid receiver wallet balance'
            }, { status: 500 });
        }

        console.log(`Calculating fees for amount: ${amount}, tier: ${senderWallet.tier}`);
        const feeConfig = await getApplicableFees('transfer', amount, senderWallet.tier, "GLOBAL");

        const feeAmount = calculateFeeAmount(feeConfig, amount);
        
        // Ensure fee is a proper number
        if (isNaN(feeAmount)) {
            console.error(`Fee calculation resulted in NaN. Amount: ${amount}, Fee config:`, feeConfig);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Error calculating transaction fee'
            }, { status: 500 });
        }
        
        console.log(`Fee calculated: ${feeAmount}, fee type: ${feeConfig.feeType}`);
        console.log(`Total amount (including fee): ${amount + feeAmount}`);
        console.log(`Sender balance: ${senderWallet.balance}`);

        // Convert all values to numbers to ensure proper comparison
        const numericSenderBalance = Number(senderWallet.balance);
        const numericTransferAmount = Number(amount);
        const numericFeeAmount = Number(feeAmount);
        const totalRequired = numericTransferAmount + numericFeeAmount;

        console.log(`🔍 DEBUG - Raw sender balance: ${senderWallet.balance} (${typeof senderWallet.balance})`);
        console.log(`🔍 DEBUG - Converted sender balance: ${numericSenderBalance} (${typeof numericSenderBalance})`);
        console.log(`🔍 DEBUG - Transfer amount: ${numericTransferAmount} (${typeof numericTransferAmount})`);
        console.log(`🔍 DEBUG - Fee amount: ${numericFeeAmount} (${typeof numericFeeAmount})`);
        console.log(`🔍 DEBUG - Total required: ${totalRequired} (${typeof totalRequired})`);
        console.log(`🔍 DEBUG - Is balance sufficient: ${numericSenderBalance >= totalRequired}`);
        console.log(`🔍 DEBUG - Balance difference: ${numericSenderBalance - totalRequired}`);

        // Add a small buffer (0.01) to handle potential rounding issues
        const ROUNDING_BUFFER = 0.01;
        
        // Check if sender has sufficient balance (already validated in wallet conditions earlier)
        if (numericSenderBalance + ROUNDING_BUFFER < totalRequired) {
            console.log(`🚫 ERROR - Insufficient balance: required ${totalRequired}, available ${numericSenderBalance}, difference ${totalRequired - numericSenderBalance}`);
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Insufficient balance to cover the transaction'
            }, { status: 400 });
        }

        // Prepare transaction record
        const timestamp = new Date();
        const transactionRef = generateTransactionRef ?
            generateTransactionRef() :
            `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const transferRecord = {
            transactionId: new mongoose.Types.ObjectId(),
            transactionRef: transactionRef,
            amount,
            date: timestamp,
        };

        // Update sender wallet - deduct transfer amount AND fee
        senderWallet.balance = numericSenderBalance - totalRequired;
        senderWallet.monthlyTransactionCount += 1;
        senderWallet.transfersSent.push({
            ...transferRecord,
            to: receiverWallet.userId || receiverWallet.entityId,
        });

        // Get the receiver's current balance as a number
        const numericReceiverBalance = Number(receiverWallet.balance);
        
        // Update recipient wallet
        receiverWallet.balance = numericReceiverBalance + numericTransferAmount; // Recipient gets the full amount, fee is kept by platform
        receiverWallet.transfersReceived.push({
            ...transferRecord,
            from: senderWallet.userId || senderWallet.entityId,
        });

        console.log(`Saving updated wallets. New sender balance: ${senderWallet.balance}, new receiver balance: ${receiverWallet.balance}`);
        
        try {
            await senderWallet.save({ session: connection });
            await receiverWallet.save({ session: connection });
            console.log('Wallets saved successfully');
        } catch (saveError) {
            console.error('Error saving wallets:', saveError);
            throw saveError;
        }

        // Get user details for creating transaction record
        console.log('Fetching user details for transaction record');
        
        // Get sender details based on entity type
        let sender;
        if (senderWallet.entityType === 'USER') {
            sender = await User.findById(senderWallet.userId || senderWallet.entityId).select('fullName email phoneNumber role').session(connection);
        } else if (senderWallet.entityType === 'MERCHANT') {
            const Merchant = (await import('@/models/Merchant')).default;
            const merchantData = await Merchant.findById(senderWallet.entityId).select('merchantName phoneNumber').session(connection);
            if (merchantData) {
                sender = {
                    fullName: merchantData.merchantName,
                    phoneNumber: merchantData.phoneNumber,
                    role: 'MERCHANT'
                };
            }
        } else if (senderWallet.entityType === 'DRIVER') {
            const Driver = (await import('@/models/Driver')).default;
            const driverData = await Driver.findById(senderWallet.entityId).select('accountHolderName applicantUserId').session(connection);
            if (driverData) {
                // Get phone number from the associated user
                const associatedUser = await User.findById(driverData.applicantUserId).select('phoneNumber').session(connection);
                sender = {
                    fullName: driverData.accountHolderName,
                    phoneNumber: associatedUser?.phoneNumber || '',
                    role: 'DRIVER'
                };
            }
        }
        
        // Get receiver details based on entity type
        let recipient;
        if (receiverWallet.entityType === 'USER') {
            recipient = await User.findById(receiverWallet.userId || receiverWallet.entityId).select('fullName email phoneNumber role').session(connection);
        } else if (receiverWallet.entityType === 'MERCHANT') {
            const Merchant = (await import('@/models/Merchant')).default;
            const merchantData = await Merchant.findById(receiverWallet.entityId).select('merchantName phoneNumber').session(connection);
            if (merchantData) {
                recipient = {
                    fullName: merchantData.merchantName,
                    phoneNumber: merchantData.phoneNumber,
                    role: 'MERCHANT'
                };
            }
        } else if (receiverWallet.entityType === 'DRIVER') {
            const Driver = (await import('@/models/Driver')).default;
            const driverData = await Driver.findById(receiverWallet.entityId).select('accountHolderName applicantUserId').session(connection);
            if (driverData) {
                // Get phone number from the associated user
                const associatedUser = await User.findById(driverData.applicantUserId).select('phoneNumber').session(connection);
                recipient = {
                    fullName: driverData.accountHolderName,
                    phoneNumber: associatedUser?.phoneNumber || '',
                    role: 'DRIVER'
                };
            }
        }

        if (!sender || !recipient) {
            console.error('Sender or recipient details not found');
            throw new Error('Failed to fetch entity details for transaction record');
        }

        // Create transaction record
        const transactionData = {
            transactionRef,
            transactionDate: timestamp,
            transactionType: 'transfer',
            status: 'completed',
            sender: {
                id: senderWallet.userId || senderWallet.entityId,
                name: sender.fullName,
                accountType: senderWallet.entityType.toLowerCase(),
                phoneNumber: sender.phoneNumber,
                accountRole: sender.role || senderWallet.entityType,
                walletTier: senderWallet.tier
            },
            receiver: {
                id: receiverWallet.userId || receiverWallet.entityId,
                name: recipient.fullName,
                accountType: receiverWallet.entityType.toLowerCase(),
                phoneNumber: recipient.phoneNumber,
                accountRole: recipient.role || receiverWallet.entityType,
                walletTier: receiverWallet.tier
            },
            transferAmount: {
                amount,
                currency: senderWallet.currency,
            },
            fees: [
                {
                    feeAmount,
                    currency: senderWallet.currency,
                    feeType: feeConfig.feeType,
                    description: feeConfig.description || `Fee for ${feeConfig.feeType}`,
                    revenueStatus: 'pending',
                },
            ],
            metadata: {
                source: 'api',
                notes: description,
            },
        };

        try {
            // Create transaction record
            console.log(`Creating transaction record with ref: ${transactionRef}`);
            await createTransactionRecord(transactionData);
            console.log('Transaction record created successfully');

            // create revenue record for the fee
            const revenueData = {
                associatedTransactionRef: transactionRef,
                transactionRef: `REV-${transactionRef}`, // Ensure unique transactionRef for revenue
                transactionDate: timestamp,
                revenueAmount: {
                    amount: feeAmount,
                    currency: senderWallet.currency,
                },
                status: 'pending',
                revenueType: feeConfig.feeType,
                metadata: {
                    description: `Fee from transaction ${transactionRef}`,
                    notes: `Fee collected from ${sender.fullName} for transfer to ${recipient.fullName}`,
                    region: "GLOBAL" // Default region if not available
                },
            };

            console.log(`Creating revenue record for fee: ${feeAmount}`);
            await createRevenueRecord(revenueData);
            console.log('Revenue record created successfully');
        } catch (recordError: unknown) {
            console.error('Error creating transaction or revenue records:', recordError);
            throw new Error(`Failed to create transaction records: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
        }

        console.log('Committing transaction...');
        await connection.commitTransaction();
        console.log('Transaction committed successfully');

        // TODO: Send Notification to the sender and recipient
        
        // Send notifications using NotificationTriggers (only for USER entities)
        const { NotificationTriggers } = await import('../../../../utils/notificationTriggers');
        
        // Send notification to sender (only if it's a USER)
        if (senderWallet.entityType === 'USER' && sender && '_id' in sender) {
            await NotificationTriggers.paymentSent(
              sender as any,
              amount,
              receiverWallet.currency,
              recipient.fullName
            );
        }
        
        // Send notification to recipient (only if it's a USER)
        if (receiverWallet.entityType === 'USER' && recipient && '_id' in recipient) {
            await NotificationTriggers.paymentReceived(
              recipient as any,
              amount,
              senderWallet.currency,
              sender.fullName
            );
        }

        return {
            success: true,
            newSenderBalance: senderWallet.balance,
            transactionId: transferRecord.transactionId,
            transactionRef,
            feeAmount,
            feeType: feeConfig.feeType,
          };

    } catch (error) {
        console.error('Error processing transaction:', error);
        // Make sure we properly abort the transaction in case of any error
        await connection.abortTransaction();
        connection.endSession();
        
        // Provide more detailed error message if available
        const errorMessage = error instanceof Error ? error.message : 'Failed to process transaction';
        
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    } finally {
        // Ensure the session ends even if something else goes wrong
        if (connection.inTransaction()) {
            await connection.abortTransaction();
        }
        connection.endSession();
    }
}


