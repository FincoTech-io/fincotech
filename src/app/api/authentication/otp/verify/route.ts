import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

export async function POST(request: Request) {
  try {
    const { phoneNumber, otp } = await request.json();
    
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' }, 
        { status: 400 }
      );
    }

    // Get the stored OTP from Redis
    const storedOTP = await redis.get(`otp:${phoneNumber}`);
    
    if (!storedOTP) {
      return NextResponse.json(
        { error: 'OTP expired or not found', valid: false }, 
        { status: 400 }
      );
    }

    // Verify if the provided OTP matches the stored OTP
    if (otp === storedOTP) {
      // Delete the OTP from Redis after successful verification
      await redis.del(`otp:${phoneNumber}`);
      
      return NextResponse.json(
        { message: 'OTP verified successfully', valid: true }, 
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid OTP', valid: false }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP', valid: false }, 
      { status: 500 }
    );
  }
} 