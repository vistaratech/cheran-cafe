import { NextResponse } from 'next/server';
import { Invitation } from '@/models';
import mongoose from 'mongoose';

async function ensureConnected() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  }
}

// GET /api/invitations/[token] — validate a token and return invitation info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await ensureConnected();

    const { token } = await params;
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

    return NextResponse.json({
      restaurantName: invitation.restaurantName,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
}
