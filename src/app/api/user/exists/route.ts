import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, userExistsByPhone } from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body to get the phone number
    const { phoneNumber } = await request.json();

    // Validate the phone number
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const exists = await userExistsByPhone(phoneNumber);

    // Return the result
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Error checking user existence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 