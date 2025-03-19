import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Initialize Redis client with timeout options
const redis = new Redis(process.env.REDIS_URL, {
  connectTimeout: 10000,
  retryStrategy: (times) => {
    console.log(`Redis connection retry attempt: ${times}`);
    return Math.min(times * 100, 3000); // Maximum 3s delay between retries
  },
});

// Add Redis error event handler
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export const maxDuration = 30; // Increase timeout to 30 seconds

export async function POST(request: Request) {
  console.log('OTP verification endpoint called');
  try {
    const { phoneNumber, otp } = await request.json();
    console.log('Verification request received for phone:', phoneNumber);
    
    if (!phoneNumber || !otp) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Phone number and OTP are required' }, 
        { status: 400 }
      );
    }

    try {
      // Get the stored OTP from Redis
      console.log('Retrieving OTP from Redis...');
      const storedOTP = await redis.get(`otp:${phoneNumber}`);
      console.log('Redis response received, OTP exists:', !!storedOTP);
      
      if (!storedOTP) {
        return NextResponse.json(
          { error: 'OTP expired or not found', valid: false }, 
          { status: 400 }
        );
      }

      // Verify if the provided OTP matches the stored OTP
      const isValid = otp === storedOTP;
      console.log('OTP validation result:', isValid);
      
      if (isValid) {
        // Delete the OTP from Redis after successful verification
        console.log('Deleting OTP from Redis...');
        await redis.del(`otp:${phoneNumber}`);
        console.log('OTP deleted successfully');
        
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
    } catch (redisError) {
      console.error('Redis error during verification:', redisError);
      return NextResponse.json(
        { error: 'Error accessing verification data', valid: false }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in verification endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process verification request', valid: false }, 
      { status: 500 }
    );
  }
} 