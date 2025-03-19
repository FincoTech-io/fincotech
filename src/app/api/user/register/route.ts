import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import { IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import { createWallet } from '@/utils/walletUtils';

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await connectToDatabase();

    // Parse the request body
    const userData = await request.json();
    const { phoneNumber, fullName, email, pin, security, nationality, idType, idNumber } = userData;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
  
    // Check if user already exists
    const existingUser = await User.findOne({ 
      phoneNumber: {$regex: new RegExp('^' + normalizedPhone.replace(/[+]/g, '\\$&') + '$', 'i') } }).exec();
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      );
    }

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Pin is required' },
        { status: 400 }
      );
    }

    // Validate PIN format (4-6 digits)
    const pinRegex = /^\d{4,6}$/;
    if (!pinRegex.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
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

    // Validate security question
    if (!security) {
      return NextResponse.json(
        { error: 'Security question is required' },
        { status: 400 }
      );
    }

    // Validate security answer
    if (!security.answer) {
      return NextResponse.json(
        { error: 'Security answer is required' },
        { status: 400 }
      );
    } 

    // Validate ID type
    if (!idType) {
      return NextResponse.json(
        { error: 'ID type is required' },
        { status: 400 }
      );
    } 

    // Validate ID number
    if (!idNumber) {
      return NextResponse.json(
        { error: 'ID number is required' },
        { status: 400 }
      );
    } 

    // Validate nationality
    if (!nationality) {
      return NextResponse.json(
        { error: 'Nationality is required' },
        { status: 400 }
      );
    } 

    // Validate full name
    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    } 

    // Validate full name format
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      return NextResponse.json(
        { error: 'Full name must contain only letters and spaces' },
        { status: 400 }
      );
    }

    // Validate full name length
    if (fullName.length < 3 || fullName.length > 50) {
      return NextResponse.json(
        { error: 'Full name must be between 3 and 50 characters' },
        { status: 400 }
      );
    } 

    // Validate email uniqueness if provided
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
      role: 'customer',
      security: {
        question: security.question,
        answer: security.answer
      },
      idType,
      idNumber,
      nationality,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save the user
    await newUser.save();
    
    // Create a wallet for the user
    try {
      const userId = newUser._id.toString();
      console.log('Creating wallet for new user:', userId);
      const walletResult = await createWallet(userId);
      console.log('Wallet created successfully:', walletResult.wallet.address);
    } catch (walletError) {
      console.error('Error creating wallet for user:', walletError);
      // We won't fail the registration if wallet creation fails
      // The wallet can be created later if needed
    }

    // Return the user data (excluding sensitive information)
    const savedUser = newUser.toObject() as Partial<IUser>;
    delete savedUser.pin 
    delete savedUser.security
    delete savedUser.idType;
    delete savedUser.idNumber;
    delete savedUser.nationality;

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: savedUser,
        success: true 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle validation errors
    if (error instanceof Error && 'name' in error && error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
} 