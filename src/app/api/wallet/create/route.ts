import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { createWallet } from '@/utils/walletUtils';

export const maxDuration = 30; // Increase timeout to 30 seconds

// API endpoint to create wallet
export async function POST(request: Request) {
  try {
    // Get userId from request body
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID format' 
      }, { status: 400 });
    }

    // Create wallet
    const result = await createWallet(userId, 'BASIC', 'USER');
    
    return NextResponse.json({ 
      success: true,
      message: result.created 
        ? 'Wallet created successfully' 
        : 'Wallet already exists',
      wallet: result.wallet 
    }, { status: result.created ? 201 : 200 });
  } catch (error: unknown) {
    console.error('Wallet creation error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet' 
    }, { status: 500 });
  }
} 