import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { IMerchant } from '@/models/Merchant';
import { createWallet } from '@/utils/walletUtils';
import jwt from 'jsonwebtoken';
import redisService from '@/utils/redis';
import { v4 as uuidv4 } from 'uuid';



export async function POST(request: NextRequest) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Parse the request body
        const merchantData = await request.json();
        const { phoneNumber, email, merchantName, merchantType, merchantAddress, merchantLicense, merchantStaff, verificationStatus, currentRegion, currentAddress, hasUnreadNotifications, notifications, advertisements, notificationPreferences, adminId } = merchantData;

        // Validate required fields
        if (!phoneNumber || !email || !merchantName || !merchantType || !merchantAddress || !merchantLicense) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Normalize phone number
        const normalizedPhone = phoneNumber.replace(/\s+/g, '');

        // Check if business already exists 
        const existingMerchant = await Merchant.findOne({ phoneNumber: { $regex: new RegExp('^' + normalizedPhone.replace(/[+]/g, '\\$&') + '$', 'i') } }).exec();
        if (existingMerchant) {
            return NextResponse.json({ error: 'Merchant with this phone number already exists' }, { status: 409 });
        }



        // Create new business
        const newMerchant = new Merchant({
            adminId,
            phoneNumber,
            email,
            merchantName,
            merchantType,
            merchantAddress,
            merchantLicense,
            merchantStaff,
            verificationStatus,
            currentRegion,
            currentAddress,
            hasUnreadNotifications,
            notifications,
            advertisements,
            notificationPreferences,
        });

        // Save merchant to database
        await newMerchant.save();

        // Create a wallet for the business
        try {
            const merchantId = newMerchant._id.toString();
            console.log('Creating wallet for new merchant:', merchantId);
            const walletResult = await createWallet(merchantId, 'MERCHANT');
            console.log('Wallet created successfully:', walletResult.wallet.address);
        } catch (walletError) {
            console.error('Error creating wallet for merchant:', walletError);
            // We won't fail the registration if wallet creation fails
            // The wallet can be created later if needed
        }

        return NextResponse.json({ message: 'Merchant registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error registering merchant:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

