import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import { IUser } from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const userData = await request.json();
    const { phoneNumber, fullName, email, pin } = userData;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber }).exec();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      );
    }

    // Check email uniqueness if provided
    if (email) {
      const emailExists = await User.findOne({ email }).exec();
      if (emailExists) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Hash the user's PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Create new user
    const newUser = new User({
      phoneNumber,
      fullName,
      email,
      pin: hashedPin, // Store the hashed PIN
      role: 'user',
    });

    // Save the user
    await newUser.save();

    // Return the user data (excluding sensitive information)
    const savedUser = newUser.toObject() as Partial<IUser>;
    delete savedUser.pin;

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: savedUser 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle validation errors
    if (error instanceof Error && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 