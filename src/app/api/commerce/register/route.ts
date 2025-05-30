import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { createWallet } from '@/utils/walletUtils';
import { validateMerchantData, MERCHANT_TYPES } from '@/utils/merchantUtils';
import { getAuthenticatedStaff, unauthorizedResponse } from '@/utils/staffAuth';

export async function POST(request: NextRequest) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Authenticate staff member (optional, but recommended for admin oversight)
        const authResult = await getAuthenticatedStaff(request);
        if (!authResult) {
            return unauthorizedResponse('Staff authentication required for merchant registration');
        }

        const { staff } = authResult;

        // Parse the request body
        const merchantData = await request.json();

        // Validate merchant data using utility function
        const validation = validateMerchantData(merchantData);
        if (!validation.isValid) {
            return NextResponse.json({ 
                success: false,
                error: 'Validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        // Normalize phone number
        const normalizedPhone = merchantData.phoneNumber.replace(/\s+/g, '');

        // Check if merchant already exists 
        const existingMerchant = await Merchant.findOne({ 
            phoneNumber: { $regex: new RegExp('^' + normalizedPhone.replace(/[+]/g, '\\$&') + '$', 'i') } 
        }).exec();
        
        if (existingMerchant) {
            return NextResponse.json({ 
                success: false,
                error: 'Merchant with this phone number already exists' 
            }, { status: 409 });
        }

        // Check for email duplicates
        const existingEmail = await Merchant.findOne({ email: merchantData.email }).exec();
        if (existingEmail) {
            return NextResponse.json({ 
                success: false,
                error: 'Merchant with this email already exists' 
            }, { status: 409 });
        }

        // Set default values for required fields
        const merchantWithDefaults = {
            ...merchantData,
            verificationStatus: merchantData.verificationStatus || 'PENDING',
            currentRegion: merchantData.currentRegion || 'global',
            hasUnreadNotifications: false,
            notifications: merchantData.notifications || [],
            advertisements: merchantData.advertisements || [],
            notificationPreferences: merchantData.notificationPreferences || {
                paymentReceived: { roles: 'MERCHANT_OWNER', sms: true, push: true, email: true },
                paymentSent: { roles: 'MERCHANT_OWNER', sms: true, push: true, email: true },
                systemUpdates: { roles: 'MERCHANT_OWNER', sms: true, push: true, email: true },
                security: { roles: 'MERCHANT_OWNER', sms: true, push: true, email: true },
                promotions: { roles: 'MERCHANT_OWNER', sms: false, push: false, email: true },
            },
            createdBy: staff._id, // Track who created the merchant
        };

        // Create new merchant
        const newMerchant = new Merchant(merchantWithDefaults);
        await newMerchant.save();

        // Create a wallet for the merchant
        let walletInfo = null;
        try {
            const merchantId = newMerchant._id.toString();
            console.log('Creating wallet for merchant:', merchantId);
            const walletResult = await createWallet(merchantId, 'MERCHANT', 'MERCHANT');
            console.log('Wallet created successfully for merchant:', walletResult.wallet.address);
            walletInfo = {
                address: walletResult.wallet.address,
                success: true
            };
        } catch (walletError) {
            console.error('Error creating wallet for merchant:', walletError);
            walletInfo = {
                error: walletError instanceof Error ? walletError.message : 'Failed to create wallet',
                success: false
            };
        }

        // Return success response with merchant data
        return NextResponse.json({ 
            success: true,
            message: 'Merchant registered successfully',
            data: {
                merchantId: newMerchant._id,
                merchantName: newMerchant.merchantName,
                email: newMerchant.email,
                phoneNumber: newMerchant.phoneNumber,
                verificationStatus: newMerchant.verificationStatus,
                wallet: walletInfo
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error registering merchant:', error);
        
        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json({
                success: false,
                error: 'Database validation failed',
                details: validationErrors
            }, { status: 400 });
        }

        if (error.code === 11000) {
            return NextResponse.json({
                success: false,
                error: 'Duplicate merchant data detected'
            }, { status: 409 });
        }

        return NextResponse.json({ 
            success: false,
            error: 'Internal server error' 
        }, { status: 500 });
    }
}

// GET endpoint to retrieve merchant types and other metadata
export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            data: {
                merchantTypes: MERCHANT_TYPES,
                availableRoles: ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER', 'MERCHANT_STAFF'],
                verificationStatuses: ['PENDING', 'VERIFIED', 'REJECTED']
            }
        });
    } catch (error) {
        console.error('Error fetching merchant metadata:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch merchant metadata' 
        }, { status: 500 });
    }
}

