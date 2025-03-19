import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  const { phoneNumber, pin } = await request.json();

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isPinValid = await bcrypt.compare(pin, user.pin);

  if (!isPinValid) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'User is not active' }, { status: 401 });
  }

  user.lastLogin = new Date();  
  await user.save();

  const token = jwt.sign(
    { userId: user._id, role: user.role }, 
    process.env.JWT_SECRET as string,
    { expiresIn: '30m' } // Token expires in 30 minutes
  );

  // Create response object
  const response = NextResponse.json({ 
    success: true,
    user: {
      id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role
    }
  });
  
  // Set HTTP-only cookie with the token
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 30, // 30 minutes in seconds
    path: '/'
  });

  return response;
}


