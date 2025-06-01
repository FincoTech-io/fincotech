import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import User from '@/models/User';
import { getUserFromSession } from '@/utils/serverAuth';
import { findWalletByEntity } from '@/utils/walletUtils';

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

    const merchant = await Merchant.findById(merchantId).select('-__v').lean();
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this merchant through merchantStaff
    const staffMember = merchant.merchantStaff.find(
      (staff: any) => staff.userId === user._id.toString()
    );
    
    // Also check the legacy merchantAccess for backward compatibility
    const legacyAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId
    );
    
    if (!staffMember && !legacyAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to view this merchant.' },
        { status: 403 }
      );
    }

    // Determine user's role - prioritize merchantStaff role over legacy access
    const userRole = staffMember?.role || user.merchantAccess?.find(
      (access: any) => access.merchantId === merchantId
    )?.userRole;

    let walletData = null;
    
    // Check if user has permission to view wallet data
    // Allow ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER to access wallet
    if (userRole && ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(userRole)) {
      try {
        const wallet = await findWalletByEntity('MERCHANT', merchantId);
        if (wallet) {
          walletData = {
            walletId: wallet._id?.toString() || wallet.id?.toString() || '',
            balance: wallet.balance,
            currency: wallet.currency,
            status: wallet.isActive ? 'ACTIVE' : 'SUSPENDED',
            address: wallet.address,
            tier: wallet.tier,
            lastTransactionDate: wallet.updatedAt
          };
        }
      } catch (walletError) {
        console.error('Error fetching wallet data:', walletError);
        // Don't fail the request if wallet lookup fails
      }
    }

    // Prepare response data
    const responseData = {
      ...merchant,
      wallet: walletData
    };

    return NextResponse.json({
      success: true,
      data: {
        merchant: responseData
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

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this merchant through merchantStaff
    const staffMember = merchant.merchantStaff.find(
      (staff: any) => staff.userId === user._id.toString()
    );
    
    // Also check the legacy merchantAccess for backward compatibility
    const legacyAccess = user.merchantAccess?.find(
      (access: any) => access.merchantId === merchantId
    );
    
    // Determine user's role - prioritize merchantStaff role over legacy access
    const userRole = staffMember?.role || legacyAccess?.userRole;
    
    if (!userRole || !['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to edit this merchant.' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    // Fields that cannot be updated via this endpoint
    const restrictedFields = [
      '_id', 
      'verificationStatus', 
      'createdAt', 
      'merchantAccess',
      'wallet'  // Wallet data must be managed through dedicated wallet APIs
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

    // Get updated wallet data for response
    let walletData = null;
    if (['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(userRole)) {
      try {
        const wallet = await findWalletByEntity('MERCHANT', merchantId);
        if (wallet) {
          walletData = {
            walletId: wallet._id?.toString() || wallet.id?.toString() || '',
            balance: wallet.balance,
            currency: wallet.currency,
            status: wallet.isActive ? 'ACTIVE' : 'SUSPENDED',
            address: wallet.address,
            tier: wallet.tier,
            lastTransactionDate: wallet.updatedAt
          };
        }
      } catch (walletError) {
        console.error('Error fetching wallet data:', walletError);
      }
    }

    // Prepare response data
    const responseData = {
      ...merchant.toObject(),
      wallet: walletData
    };

    return NextResponse.json({
      success: true,
      data: {
        merchant: responseData
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

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this merchant through merchantStaff
    const staffMember = merchant.merchantStaff.find(
      (staff: any) => staff.userId === user._id.toString()
    );
    
    // Also check the legacy merchantAccess for backward compatibility
    const legacyAccess = user.merchantAccess?.find(
      (access: any) => access.merchantId === merchantId
    );
    
    // Determine user's role - prioritize merchantStaff role over legacy access
    const userRole = staffMember?.role || legacyAccess?.userRole;
    
    // Only ADMIN and MERCHANT_OWNER can delete accounts
    if (!userRole || !['ADMIN', 'MERCHANT_OWNER'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only merchant owners and admins can delete merchant accounts.' },
        { status: 403 }
      );
    }

    // Check if merchant has an associated wallet and ensure zero balance
    let walletId = null;
    try {
      const wallet = await findWalletByEntity('MERCHANT', merchantId);
      if (wallet) {
        walletId = wallet._id?.toString() || wallet.id?.toString() || '';
        if (wallet.balance > 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot delete merchant account with remaining wallet balance of ${wallet.currency} ${wallet.balance}. Please withdraw all funds first.` 
            },
            { status: 400 }
          );
        }
      }
    } catch (walletError) {
      console.error('Error checking wallet balance:', walletError);
      // Continue with deletion even if wallet check fails
    }

    // Store merchant info for response
    const deletedMerchantInfo = {
      id: merchant._id.toString(),
      merchantName: merchant.merchantName,
      email: merchant.email,
      merchantType: merchant.merchantType,
      walletId
    };

    // Remove merchant access from all users who have it
    const userIds = merchant.merchantStaff.map(staff => staff.userId);
    if (userIds.length > 0) {
      await User.updateMany(
        { _id: { $in: userIds } },
        {
          $pull: {
            merchantAccess: { merchantId: merchantId }
          }
        }
      );
    }

    // Delete the merchant
    await Merchant.findByIdAndDelete(merchantId);

    return NextResponse.json({
      success: true,
      data: {
        deletedMerchant: deletedMerchantInfo
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