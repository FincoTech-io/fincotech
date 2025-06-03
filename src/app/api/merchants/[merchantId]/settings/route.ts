import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getUserFromSession } from '@/utils/serverAuth';
import { checkMerchantStaffAccess } from '@/utils/merchantUtils';
import { Merchant } from '@/models/Merchant';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extend the timeout for this API route to handle image uploads
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Validate merchantId format
    if (!ObjectId.isValid(merchantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user from token
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has access to view this merchant's settings
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER', 
      'MERCHANT_MANAGER'
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to view merchant settings.' },
        { status: 403 }
      );
    }

    // Find merchant and get settings data
    const merchant = await Merchant.findById(merchantId)
      .select('merchantName merchantType profileImage')
      .lean();

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        merchantName: merchant.merchantName,
        merchantType: merchant.merchantType,
        profileImage: merchant.profileImage || null
      },
      message: 'Merchant settings retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving merchant settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Validate merchantId format
    if (!ObjectId.isValid(merchantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user from token
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { profileImage } = await request.json();
    console.log('Received profile image update request for merchant:', merchantId);

    // Validate required fields
    if (!profileImage || !profileImage.base64) {
      return NextResponse.json(
        { success: false, error: 'Profile image with base64 data is required' },
        { status: 400 }
      );
    }

    // Find merchant and check access
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has access to update this merchant's settings
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER', 
      'MERCHANT_MANAGER'
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Insufficient permissions to update merchant settings.' },
        { status: 403 }
      );
    }

    console.log('🔍 Uploading profile image to Cloudinary...');

    // Delete old profile image if exists
    if (merchant.profileImage?.publicId) {
      try {
        console.log('🗑️ Deleting old profile image:', merchant.profileImage.publicId);
        await cloudinary.uploader.destroy(merchant.profileImage.publicId);
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete old profile image:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to Cloudinary
    const uploadFolder = `fincotech/Merchant/${merchantId}/profile`;
    
    try {
      const uploadResponse = await cloudinary.uploader.upload(profileImage.base64, {
        folder: uploadFolder,
        public_id: `profile_${Date.now()}`,
        // Store original at highest quality
        quality: 95,
        eager: [
          // Main display image - 1200x600 max with maintained aspect ratio
          { 
            width: 1200, 
            height: 600, 
            crop: 'limit', 
            gravity: 'face', 
            quality: 90
          },
          // Standard sizes for different use cases
          { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 85 }, // Square medium
          { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 85 }, // Square small
          { width: 100, height: 100, crop: 'fill', gravity: 'face', quality: 80 }  // Square thumbnail
        ],
        eager_async: false, // Generate all sizes immediately
        timeout: 60000
      });

      const newProfileImage = {
        url: uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url, // Use 1200x600 as main URL
        publicId: uploadResponse.public_id,
        alt: `${merchant.merchantName} profile image`,
        width: uploadResponse.eager?.[0]?.width || uploadResponse.width,
        height: uploadResponse.eager?.[0]?.height || uploadResponse.height,
        // Include URLs for different sizes
        sizes: {
          original: uploadResponse.secure_url, // Highest quality original
          display: uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url, // 1200x600 max
          medium: uploadResponse.eager?.[1]?.secure_url || uploadResponse.secure_url, // 400x400 square
          small: uploadResponse.eager?.[2]?.secure_url || uploadResponse.secure_url, // 200x200 square
          thumbnail: uploadResponse.eager?.[3]?.secure_url || uploadResponse.secure_url // 100x100 square
        }
      };

      console.log('✅ Profile image uploaded successfully:', uploadResponse.public_id);

      // Update merchant with new profile image
      const updatedMerchant = await Merchant.findByIdAndUpdate(
        merchantId,
        { 
          profileImage: newProfileImage,
          updatedAt: new Date()
        },
        { new: true }
      ).select('merchantName merchantType profileImage');

      if (!updatedMerchant) {
        return NextResponse.json(
          { success: false, error: 'Failed to update merchant profile image' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          merchantId,
          merchantName: updatedMerchant.merchantName,
          profileImage: updatedMerchant.profileImage,
          uploadedAt: new Date().toISOString()
        },
        message: 'Profile image updated successfully'
      });

    } catch (uploadError: any) {
      console.error('❌ Cloudinary upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Image upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating merchant profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Validate merchantId format
    if (!ObjectId.isValid(merchantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user from token
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find merchant and check access
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has access to delete this merchant's profile image
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER'  // Only admin and owner can delete profile image
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only admin and merchant owner can delete profile image.' },
        { status: 403 }
      );
    }

    if (!merchant.profileImage) {
      return NextResponse.json(
        { success: false, error: 'No profile image to delete' },
        { status: 404 }
      );
    }

    console.log('🗑️ Deleting profile image from Cloudinary:', merchant.profileImage.publicId);

    // Delete image from Cloudinary
    try {
      await cloudinary.uploader.destroy(merchant.profileImage.publicId);
      console.log('✅ Profile image deleted from Cloudinary');
    } catch (deleteError) {
      console.warn('⚠️ Failed to delete image from Cloudinary:', deleteError);
      // Continue with database update even if Cloudinary deletion fails
    }

    // Remove profile image from merchant
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { 
        $unset: { profileImage: 1 },
        updatedAt: new Date()
      },
      { new: true }
    ).select('merchantName merchantType');

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        merchantName: updatedMerchant?.merchantName,
        deletedAt: new Date().toISOString()
      },
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting merchant profile image:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 