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

  const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  return NextResponse.json({ token }, { status: 200 });
}


