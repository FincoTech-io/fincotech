import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getAuthenticatedStaff, isAdmin, unauthorizedResponse, forbiddenResponse } from '@/utils/staffAuth';
import { createMissingMerchantWallets } from '@/utils/merchantUtils';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Authenticate staff member
    const authResult = await getAuthenticatedStaff(request);
    if (!authResult) {
      return unauthorizedResponse('Staff authentication required');
    }

    const { staff } = authResult;

    // Only admins can run this operation
    if (!isAdmin(staff.role)) {
      return forbiddenResponse('Admin access required to fix merchant wallets');
    }

    console.log(`Admin ${staff.firstName} ${staff.lastName} is running merchant wallet fix...`);

    // Run the wallet creation for missing merchants
    const results = await createMissingMerchantWallets();

    return NextResponse.json({
      success: true,
      message: 'Merchant wallet fix completed',
      data: {
        processed: results.processed,
        created: results.created,
        errors: results.errors,
        executedBy: `${staff.firstName} ${staff.lastName}`,
        executedAt: new Date()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fixing merchant wallets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix merchant wallets'
    }, { status: 500 });
  }
} 