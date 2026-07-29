import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@/models';
import Restaurant from '@/models/Restaurant';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import debug from 'debug';
import { seedRestaurantData } from '@/lib/seed-data';

const log = debug('chefcito:auth:google');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
        dbName: process.env.MONGODB_DB
      });
    }

    const body = await request.json();
    const { credential, role } = body;

    if (!credential) {
      log('[Google] Missing credential');
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      log('[Google] Invalid token payload');
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name, sub: googleId } = payload;
    log('[Google] Processing auth for:', email, 'role:', role || 'none (login flow)');

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // === EXISTING USER — Login flow ===
      log('[Google] Existing user found:', user.id);

      // Link googleId if not already set — use updateOne to avoid full doc validation
      if (!user.googleId) {
        await User.updateOne({ _id: user._id }, { $set: { googleId } });
        log('[Google] Linked googleId to existing user');
      }
    } else {
      // === NEW USER — Registration flow ===
      log('[Google] New user, creating account');

      // Default to Owner role if not specified (Google Sign-Up without explicit role)
      const userRole = role || 'Owner';

      // Create the user
      const userId = uuidv4();
      user = new User({
        id: userId,
        name: name || email?.split('@')[0] || 'User',
        email,
        googleId,
        password: null,
        role: userRole,
        status: 'Off Shift',
      });
      await user.save();
      log('[Google] User created:', user.id, 'role:', userRole);

      // If this is an Owner, create a restaurant for them
      if (userRole === 'Owner') {
        const restaurantId = uuidv4();
        const restaurantName = `${name || 'Mi'} Restaurante`;

        const restaurant = new Restaurant({
          id: restaurantId,
          name: restaurantName,
          ownerId: userId,
        });
        await restaurant.save();

        // Seed default data so new users can test the app immediately
        await seedRestaurantData(restaurantId);

        await User.updateOne({ id: userId }, { $set: { restaurantId } });
        log('[Google] Restaurant created:', restaurantId, 'for user:', userId);
      }
    }

    // Re-fetch user to include restaurantId that may have been set via updateOne
    const freshUser = await User.findOne({ id: user.id });
    if (freshUser) user = freshUser;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'chefcito_secret_key',
      { expiresIn: '24h' }
    );

    const userObject = user.toObject();
    delete userObject.password;

    log('[Google] Auth successful, returning user:', user.id);

    return NextResponse.json({ user: userObject, token });
  } catch (error: any) {
    log('[Google] Unhandled error:', error);
    console.error('[Google Auth] Full error:', error);

    // Provide specific error messages based on error type
    if (error.message?.includes('invalid_token') || error.message?.includes('Token used too late')) {
      return NextResponse.json(
        { error: 'Google token expired or invalid. Please try again.' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Wrong recipient') || error.message?.includes('aud')) {
      return NextResponse.json(
        { error: 'Google Client ID mismatch. Check GOOGLE_CLIENT_ID in env.' },
        { status: 400 }
      );
    }

    if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Database connection failed. Check MONGODB_URI.' },
        { status: 503 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User already exists with this email. Try logging in instead.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: `Google authentication failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
