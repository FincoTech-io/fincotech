import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import User from '@/models/User';
import { getUserFromSession } from '@/utils/serverAuth';

// GET /api/merchants/[merchantId] - Get merchant account data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { merchantId } = await params;
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this merchant
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to view this merchant.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId).select('-__v').lean();
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchant
      }
    });

  } catch (error: any) {
    console.error('Error fetching merchant account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch merchant account' },
      { status: 500 }
    );
  }
}

// PUT /api/merchants/[merchantId] - Update merchant account data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { merchantId } = await params;
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to edit this merchant
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to edit this merchant.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();
    
    // Fields that cannot be updated via this endpoint
    const restrictedFields = [
      '_id', 
      'verificationStatus', 
      'createdAt', 
      'merchantAccess'
    ];
    
    // Remove restricted fields from updates
    restrictedFields.forEach(field => {
      delete updates[field];
    });

    // Special handling for email updates - need to check if email is already in use
    if (updates.email && updates.email !== merchant.email) {
      const existingMerchant = await Merchant.findOne({ 
        email: updates.email,
        _id: { $ne: merchantId }
      });
      
      if (existingMerchant) {
        return NextResponse.json(
          { success: false, error: 'Email address is already in use by another merchant' },
          { status: 400 }
        );
      }
    }

    // Special handling for phone number updates
    if (updates.phoneNumber && updates.phoneNumber !== merchant.phoneNumber) {
      const existingMerchant = await Merchant.findOne({ 
        phoneNumber: updates.phoneNumber,
        _id: { $ne: merchantId }
      });
      
      if (existingMerchant) {
        return NextResponse.json(
          { success: false, error: 'Phone number is already in use by another merchant' },
          { status: 400 }
        );
      }
    }

    // Update merchant data using proper assignment
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        (merchant as any)[key] = updates[key];
      }
    });

    merchant.updatedAt = new Date();
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchant: merchant.toObject()
      },
      message: 'Merchant account updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating merchant account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update merchant account' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[merchantId] - Delete merchant account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { merchantId } = await params;
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to delete this merchant (only ADMIN or MERCHANT_OWNER)
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only ADMIN or MERCHANT_OWNER can delete merchant accounts.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Store merchant data for response before deletion
    const deletedMerchantData = {
      id: merchant._id,
      merchantName: merchant.merchantName,
      email: merchant.email,
      merchantType: merchant.merchantType
    };

    // Remove merchant access from all users
    await User.updateMany(
      { 'merchantAccess.merchantId': merchantId },
      { $pull: { merchantAccess: { merchantId: merchantId } } }
    );

    // Delete the merchant
    await Merchant.findByIdAndDelete(merchantId);

    return NextResponse.json({
      success: true,
      data: {
        deletedMerchant: deletedMerchantData
      },
      message: 'Merchant account deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting merchant account:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete merchant account' },
      { status: 500 }
    );
  }
} 