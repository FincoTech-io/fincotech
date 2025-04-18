import { NextResponse } from 'next/server';
import twilio from 'twilio';
import redisClient from '@/utils/redis';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Generate a random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const maxDuration = 30; // Increase timeout to 30 seconds

export async function POST(request: Request) {
  console.log('OTP endpoint called');
  try {
    const { phoneNumber } = await request.json();
    console.log('Phone number received:', phoneNumber);
    
    if (!phoneNumber) {
      console.log('Phone number missing');
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const otp = generateOTP();
    const message = `Your OTP is ${otp}`;
    console.log('OTP generated');

    try {
      // Send OTP via Twilio
      console.log('Sending OTP via Twilio...');
      const twilioResponse = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log('Twilio SMS sent successfully', twilioResponse.sid);
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }

    try {
      // Store OTP in Redis with a 5-minute expiration
      console.log('Storing OTP in Redis...');
      const stored = await redisClient.setWithExpiry(`otp:${phoneNumber}`, otp, 300);
      if (!stored) {
        console.error('Failed to store OTP in Redis');
        return NextResponse.json({ 
          error: 'Failed to store OTP, but SMS was sent', 
          smsSent: true 
        }, { status: 500 });
      }
      console.log('OTP stored in Redis successfully');
    } catch (redisError) {
      console.error('Redis error:', redisError);
      return NextResponse.json({ 
        error: 'Failed to store OTP, but SMS was sent', 
        smsSent: true 
      }, { status: 500 });
    }

    console.log('OTP process completed successfully');
    return NextResponse.json({ message: 'OTP sent successfully', success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in OTP endpoint:', error);
    return NextResponse.json({ error: 'Failed to process OTP request', success: false }, { status: 500 });
  }
}
