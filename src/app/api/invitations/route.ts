import { NextResponse } from 'next/server';
import { Invitation, User } from '@/models';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

async function ensureConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  }
}

// POST /api/invitations — owner creates an invitation link
export async function POST(request: Request) {
  try {
    await ensureConnected();

    const body = await request.json();
    const { ownerId, role } = body;

    if (!ownerId || !role) {
      return NextResponse.json({ error: 'ownerId and role are required' }, { status: 400 });
    }

    // Use the owner's name as the restaurant display name
    const owner = await User.findOne({ id: ownerId });
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await Invitation.create({
      token,
      ownerId,
      restaurantId: ownerId, // no separate restaurant entity; use ownerId
      restaurantName: owner.name,
      role,
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/register?token=${token}`;

    return NextResponse.json({ token, link, expiresAt });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
