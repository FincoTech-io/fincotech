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

            if (isNaN(amount) || amount <= 0) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Amount must be a positive number'
                    },
                    { status: 400 }
                );
            }

            try {

                const walletIsEligible = await walletConditions(walletIdentifier, amount);
                
                // Extract the response data from the NextResponse object
                const walletResponse = await walletIsEligible.json();
                
                if (!walletResponse.isValid) {
                    return NextResponse.json(
                        { success: false, error: walletResponse.error },
                        { status: 400 }
                    );
                }

                const result = await processTransaction(userId, walletIdentifier, amount, description);
                
                // Make sure we properly return the result to the client
                if (result instanceof NextResponse) {
                    return result;
                }

                return NextResponse.json(
                    { success: true, message: 'Transfer completed successfully' },
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
        let receiverId;

        if (identifier.length > 24) {
            const receiverWallet = await Wallet.findOne({ address: identifier });
            if (!receiverWallet) {
                return NextResponse.json({
                    success: false,
                    error: 'Receiver wallet not found with the provided address'
                }, { status: 404 });
            }
            receiverId = receiverWallet.userId.toString();
        } else {
            receiverId = identifier;
        }

        return await transfer(userId, receiverId, amount, description);
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
        if (amount <= 0) {
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Amount must be greater than 0'
            }, { status: 400 });
        }

        const senderWallet = await Wallet.findOne({ userId: userId }).session(connection);
        const receiverWallet = await Wallet.findOne({ userId: receiverId }).session(connection);

        if (!senderWallet) {
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Sender wallet not found'
            }, { status: 400 });
        }

        if (!receiverWallet) {
            await connection.abortTransaction();
            connection.endSession();
            return NextResponse.json({
                success: false,
                error: 'Wallet not found'
            }, { status: 400 });
        }

        const feeConfig = await getApplicableFees('transfer', amount, senderWallet.tier, "GLOBAL");

        const feeAmount = calculateFeeAmount(feeConfig, amount);

        await walletConditions(userId, amount + feeAmount);

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
        senderWallet.balance -= (amount + feeAmount);
        senderWallet.monthlyTransactionCount += 1;
        senderWallet.transfersSent.push({
            ...transferRecord,
            to: receiverWallet.userId,
        });

        // Update recipient wallet
        receiverWallet.balance += amount; // Recipient gets the full amount, fee is kept by platform
        receiverWallet.transfersReceived.push({
            ...transferRecord,
            from: senderWallet.userId,
        });

        await senderWallet.save({ session: connection });
        await receiverWallet.save({ session: connection });

        // Get user details for creating transaction record
        const sender = await User.findById(userId).select('fullName email').session(connection);
        const recipient = await User.findById(receiverId).select('fullName email').session(connection);

        // Create transaction record
        const transactionData = {
            transactionRef,
            transactionDate: timestamp,
            transactionType: 'transfer',
            status: 'completed',
            sender: {
                id: userId,
                name: sender?.fullName,
                accountType: 'customer',
            },
            recipient: {
                id: receiverId,
                name: recipient?.fullName,
                accountType: 'customer',
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

        // Create transaction record
        await createTransactionRecord(transactionData);

        // create revenue record for the fee
        const revenueData = {
            associatedTransactionRef: transactionRef,
            transactionDate: timestamp,
            revenueAmount: {
                amount: feeAmount,
                currency: senderWallet.currency,
            },
            status: 'pending',
            revenueType: feeConfig.feeType,
            metadata: {
                description: `Fee from transaction ${transactionRef}`,
            },
        };

        await createRevenueRecord(revenueData);

        await connection.commitTransaction();

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
        return NextResponse.json({
            success: false,
            error: 'Failed to process transaction'
        }, { status: 500 });
    }
}


