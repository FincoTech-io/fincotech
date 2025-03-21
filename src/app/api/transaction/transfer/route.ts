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

export async function POST(request: NextRequest) {

    try {
        // Get token from Authorization header (for mobile apps)
        const authHeader = request.headers.get('Authorization');
        let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

        // Fallback to cookies (for web apps)
        if (!token) {
            token = request.cookies.get('auth_token')?.value || null;
        }

        // If no token, return unauthorized
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No authentication token provided'
                },
                { status: 401 }
            );
        }
        try {
            // Verify the token
            const secretKey = new TextEncoder().encode(
                process.env.JWT_SECRET as string
            );

            const { payload } = await jwtVerify(token, secretKey);

            // Extract userId from token payload
            const userId = payload.userId as string;

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

            const toUser = await User.findById(toUserId)
                .select('-pin -security')  // Exclude sensitive fields
                .lean()
                .exec();

            if (!toUser) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Receiver not found'
                    },
                    { status: 404 }
                );
            }

            const walletIdentifier = toUserId || toAddress;

            if (!walletIdentifier || !amount || !description) {
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
                        message: 'Amount must be a positive number'
                    },
                    { status: 400 }
                );
            }

            try {

                const walletIsEligible = await walletConditions(walletIdentifier, numericAmount);
                
                // Extract the response data from the NextResponse object
                const walletResponse = await walletIsEligible.json();
                
                if (!walletResponse.isValid) {
                    return NextResponse.json(
                        { success: false, error: walletResponse.error },
                        { status: 400 }
                    );
                }

                const result = await processTransaction(userId, walletIdentifier, numericAmount, description);
                
                // Check if the result is already a NextResponse (an error)
                if (result instanceof NextResponse) {
                    return result;
                }
                
                // If it's a success object, wrap it in a NextResponse
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


        } catch (error) {
            console.error('Error transferring funds:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to transfer funds'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error transferring funds:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to transfer funds'
        }, { status: 500 });
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
        
        let receiverId;

        if (identifier.length > 24) {
            // Looking up by wallet address
            const receiverWallet = await Wallet.findOne({ address: identifier });
            if (!receiverWallet) {
                return NextResponse.json({
                    success: false,
                    error: 'Receiver wallet not found with the provided address'
                }, { status: 404 });
            }
            receiverId = receiverWallet.userId.toString();
        } else {
            // When identifier is a user ID, verify that the user exists
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
        return result;
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
        const senderWallet = await Wallet.findOne({ userId: userId }).session(connection);
        console.log(`Looking up receiver wallet for user: ${receiverId}`);
        const receiverWallet = await Wallet.findOne({ userId: receiverId }).session(connection);

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

        // Check if sender has sufficient balance (already validated in wallet conditions earlier)
        if (numericSenderBalance < totalRequired) {
            console.log(`Insufficient balance: required ${totalRequired}, available ${numericSenderBalance}`);
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
            to: receiverWallet.userId,
        });

        // Get the receiver's current balance as a number
        const numericReceiverBalance = Number(receiverWallet.balance);
        
        // Update recipient wallet
        receiverWallet.balance = numericReceiverBalance + numericTransferAmount; // Recipient gets the full amount, fee is kept by platform
        receiverWallet.transfersReceived.push({
            ...transferRecord,
            from: senderWallet.userId,
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
        const sender = await User.findById(userId).select('fullName email phoneNumber role').session(connection);
        const recipient = await User.findById(receiverId).select('fullName email phoneNumber role').session(connection);

        if (!sender || !recipient) {
            console.error('Sender or recipient user details not found');
            throw new Error('Failed to fetch user details for transaction record');
        }

        // Create transaction record
        const transactionData = {
            transactionRef,
            transactionDate: timestamp,
            transactionType: 'transfer',
            status: 'completed',
            sender: {
                id: userId,
                name: sender.fullName,
                accountType: 'customer',
                phoneNumber: sender.phoneNumber,
                accountRole: sender.role || 'CUSTOMER',
                walletTier: senderWallet.tier
            },
            receiver: {
                id: receiverId,
                name: recipient.fullName,
                accountType: 'customer',
                phoneNumber: recipient.phoneNumber,
                accountRole: recipient.role || 'CUSTOMER',
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


