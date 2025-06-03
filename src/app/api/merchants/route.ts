import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query - only show verified merchants for public access
    let query: any = {
      verificationStatus: 'VERIFIED' // Only show verified merchants publicly
    };
    
    // Filter by merchant type (e.g., 'RESTAURANT')
    if (type && type !== 'all') {
      query.merchantType = type.toUpperCase();
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { merchantName: { $regex: search, $options: 'i' } },
        { merchantAddress: { $regex: search, $options: 'i' } },
        { currentAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Select only public fields - no sensitive information
    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('merchantName merchantType merchantAddress currentAddress profileImage restaurantMenu.restaurantInfo createdAt')
      .lean();

    const total = await Merchant.countDocuments(query);

    // Transform data for public consumption
    const publicMerchants = merchants.map(merchant => ({
      id: merchant._id,
      name: merchant.merchantName,
      type: merchant.merchantType,
      address: merchant.merchantAddress,
      currentAddress: merchant.currentAddress,
      profileImage: merchant.profileImage || null,
      hasMenu: !!merchant.restaurantMenu,
      cuisineTypes: merchant.restaurantMenu?.restaurantInfo?.cuisineTypes || [],
      priceRange: merchant.restaurantMenu?.restaurantInfo?.priceRange || null,
      rating: merchant.restaurantMenu?.restaurantInfo?.rating || { average: 0, totalReviews: 0 },
      createdAt: merchant.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        merchants: publicMerchants,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
          currentPage: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          type: type || 'all',
          search: search || null
        }
      },
      message: `Found ${publicMerchants.length} ${type ? type.toLowerCase() : ''} merchants`
    });

  } catch (error: any) {
    console.error('Error fetching public merchants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchants' },
      { status: 500 }
    );
  }
} 