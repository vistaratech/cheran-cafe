import { NextResponse } from 'next/server';
import { Invitation, User } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

async function ensureConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  }
}

// POST /api/register/staff — register a staff account via invitation token
export async function POST(request: Request) {
  try {
    await ensureConnected();

    const body = await request.json();
    const { token, username, password, email } = body;

    if (!token || !username || !password) {
      return NextResponse.json({ error: 'token, username, and password are required' }, { status: 400 });
    }

    // Validate invitation
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }
    if (invitation.usedAt) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
    }
    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    // Check username uniqueness
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Check email uniqueness if provided
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    // Create the staff user
    const user = new User({
      id: uuidv4(),
      name: username,
      username,
      email: email || null,
      password,
      role: invitation.role,
      restaurantId: invitation.restaurantId,
      status: 'Off Shift',
    });
    await user.save();

    // Mark invitation as used
    invitation.usedAt = new Date();
    await invitation.save();

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error registering staff:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
