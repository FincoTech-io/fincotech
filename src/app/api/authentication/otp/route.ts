import { NextResponse } from 'next/server';
import twilio from 'twilio';
import Redis from 'ioredis';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Generate a random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const otp = generateOTP();
    const message = `Your OTP is ${otp}`;

    // Send OTP via Twilio
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    // Store OTP in Redis with a 5-minute expiration
    await redis.setex(`otp:${phoneNumber}`, 300, otp);

    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
