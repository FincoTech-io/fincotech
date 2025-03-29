import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Business from '@/models/Business';
import { IBusiness } from '@/models/Business';
import { createWallet } from '@/utils/walletUtils';
import jwt from 'jsonwebtoken';
import redisService from '@/utils/redis';
import { v4 as uuidv4 } from 'uuid';



export async function POST(request: NextRequest) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Parse the request body
        const businessData = await request.json();
        const { phoneNumber, email, businessName, businessType, businessAddress, businessLicense, businessStaff, verificationStatus, currentRegion, currentAddress, hasUnreadNotifications, notifications, advertisements, notificationPreferences, adminId } = businessData;

        // Validate required fields
        if (!phoneNumber || !email || !businessName || !businessType || !businessAddress || !businessLicense) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Normalize phone number
        const normalizedPhone = phoneNumber.replace(/\s+/g, '');

        // Check if business already exists 
        const existingBusiness = await Business.findOne({ phoneNumber: { $regex: new RegExp('^' + normalizedPhone.replace(/[+]/g, '\\$&') + '$', 'i') } }).exec();
        if (existingBusiness) {
            return NextResponse.json({ error: 'Business with this phone number already exists' }, { status: 409 });
        }



        // Create new business
        const newBusiness = new Business({
            adminId,
            phoneNumber,
            email,
            businessName,
            businessType,
            businessAddress,
            businessLicense,
            businessStaff,
            verificationStatus,
            currentRegion,
            currentAddress,
            hasUnreadNotifications,
            notifications,
            advertisements,
            notificationPreferences,
        });

        // Save business to database
        await newBusiness.save();

        // Create a wallet for the business
        try {
            const businessId = newBusiness._id.toString();
            console.log('Creating wallet for new business:', businessId);
            const walletResult = await createWallet(businessId, 'BUSINESS');
            console.log('Wallet created successfully:', walletResult.wallet.address);
        } catch (walletError) {
            console.error('Error creating wallet for business:', walletError);
            // We won't fail the registration if wallet creation fails
            // The wallet can be created later if needed
        }

        return NextResponse.json({ message: 'Business registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error registering business:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

