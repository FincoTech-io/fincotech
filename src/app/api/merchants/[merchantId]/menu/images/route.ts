import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getUserFromSession } from '@/utils/serverAuth';
import { checkMerchantStaffAccess } from '@/utils/merchantUtils';
import { uploadImageToCloudinary } from '@/utils/applicationUtils';
import { ObjectId } from 'mongodb';

// Extend the timeout for image uploads
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(
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

    // Check if user has access to update this merchant's menu
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER', 
      'MERCHANT_MANAGER'
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Insufficient permissions to upload images.' },
        { status: 403 }
      );
    }

    // Parse request body
    const { images } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: 'Images array is required' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Processing ${images.length} images for merchant ${merchantId}`);

    // Process images sequentially
    const uploadedImages = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      
      try {
        console.log(`📤 [${i + 1}/${images.length}] Uploading image: ${imageData.itemName || 'Unknown'}`);
        console.log(`📋 Image data keys: ${Object.keys(imageData).join(', ')}`);
        
        // Validate required fields
        if (!imageData.base64) {
          throw new Error(`Missing base64 data. Available fields: ${Object.keys(imageData).join(', ')}`);
        }

        // Validate base64 format
        if (typeof imageData.base64 !== 'string') {
          throw new Error(`base64 must be a string, got: ${typeof imageData.base64}`);
        }

        if (imageData.base64.length < 100) {
          throw new Error(`base64 data too short (${imageData.base64.length} chars), might be invalid`);
        }
        
        // Generate unique item ID for folder structure
        const itemId = imageData.itemId || `item_${Date.now()}_${i}`;
        const cloudinaryFolder = `fincotech/Merchant/${merchantId}/${itemId}`;
        
        console.log(`🗂️ Uploading to folder: ${cloudinaryFolder}`);
        console.log(`📏 Base64 length: ${imageData.base64.length} characters`);
        
        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(
          imageData.base64,
          cloudinaryFolder,
          `${(imageData.itemName || 'item').replace(/[^a-zA-Z0-9]/g, '_')}_image`
        );
        
        uploadedImages.push({
          itemId: itemId,
          itemName: imageData.itemName,
          originalIndex: i,
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          uploadedAt: uploadResult.uploadedAt
        });
        
        console.log(`✅ [${i + 1}/${images.length}] Successfully uploaded: ${imageData.itemName || 'Unknown'}`);
        
      } catch (error) {
        console.error(`❌ [${i + 1}/${images.length}] Error uploading image:`, error);
        console.error(`📋 Failed image data:`, JSON.stringify(imageData, null, 2));
        
        uploadedImages.push({
          itemId: imageData.itemId || `item_${Date.now()}_${i}`,
          itemName: imageData.itemName,
          originalIndex: i,
          error: error instanceof Error ? error.message : 'Upload failed',
          uploadedAt: new Date()
        });
      }
    }

    const successCount = uploadedImages.filter(img => !img.error).length;
    const errorCount = uploadedImages.filter(img => img.error).length;

    console.log(`🎉 Upload completed: ${successCount} successful, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        uploadedImages,
        summary: {
          total: images.length,
          successful: successCount,
          failed: errorCount
        }
      },
      message: `Successfully uploaded ${successCount} of ${images.length} images`
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 