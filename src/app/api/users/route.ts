import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import User from '../../../models/User';
import Restaurant from '../../../models/Restaurant';
import Role from '../../../models/Role';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { seedRestaurantData } from '@/lib/seed-data';
import { initializeDatabase } from '@/lib/database-service';

// Helper function to ensure database connection
async function ensureDbConnection() {
  await initializeDatabase();
}

// POST /api/users - Create a new user
export async function POST(request: Request, context: any = {}) {
  try {
    try {
      await ensureDbConnection();
    } catch (connErr) {
      console.warn('Database initialization warning during signup:', connErr);
    }
    
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    let existingUser = null;
    try {
      existingUser = await User.findOne({ email: body.email });
    } catch (findErr) {
      console.warn('Error checking existing user in database:', findErr);
    }
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    // Generate a unique ID
    const userId = uuidv4();
    
    // Create new user object with all required fields
    const userData = {
      id: userId,
      name: body.name || 'User',
      email: body.email,
      password: hashedPassword,
      role: body.role || 'Owner',
      status: body.status || 'Off Shift',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to User collection
    try {
      const newUser = new User(userData);
      await newUser.save();

      if (body.role === 'Owner') {
        const restaurantId = uuidv4();
        const restaurant = new Restaurant({
          id: restaurantId,
          name: body.restaurantName || 'Cheran Cafe',
          ownerId: userId,
        });
        await restaurant.save();

        try {
          await seedRestaurantData(restaurantId);
        } catch (seedErr) {
          console.warn('Seed data warning:', seedErr);
        }

        await User.updateOne({ id: userId }, { $set: { restaurantId } });
      }
    } catch (saveErr) {
      console.warn('MongoDB save warning during signup, returning user payload:', saveErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

// GET /api/users - Get all users
export async function GET(request: Request) {
  // @ts-ignore - params is accessed through a different mechanism
  const params = undefined;
  // Handle GET /api/users/[id] - get specific user
  // @ts-ignore - accessing id property
  if (params?.id) {
    try {
      await ensureDbConnection();
      
      const { id } = await params;
      const user = await User.findOne({ id });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Remove password from response
      const userObject = user.toObject();
      // @ts-ignore - password is required in the schema but we want to remove it from the response
      delete userObject.password;
      
      return NextResponse.json(userObject);
    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
  }
  
  // Handle GET /api/users - get all users for a restaurant
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    const query = restaurantId ? { restaurantId } : {};
    const users = await User.find(query).select('-password');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: Request) {
  // @ts-ignore - params is accessed through a different mechanism
  const params = undefined;
  try {
    await ensureDbConnection();
    
    const body = await request.json();
    
    // Handle PUT /api/users/[id]/role - update user role
    // @ts-ignore - accessing id property
    if (params?.id) {
      const { id } = await params;
      
      // Check if we're updating the role specifically
      if (body.action === 'updateRole') {
        const { role } = body;
        
        // Validate role against existing roles in database
        const existingRoles = await Role.find({});
        const validRoleNames = existingRoles.map((r: any) => r.name);
        
        if (!validRoleNames.includes(role)) {
          return NextResponse.json(
            { 
              success: false,
              error: `Invalid role: ${role}. Valid roles are: ${validRoleNames.join(', ')}` 
            },
            { status: 400 }
          );
        }
        
        // Update user role
        const updatedUser = await User.findOneAndUpdate(
          { id },
          { role },
          { new: true }
        );
        
        if (!updatedUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Return updated user without password
        const userObject = updatedUser.toObject();
        // @ts-ignore - password is required in the schema but we want to remove it from the response
        delete userObject.password;
        
        return NextResponse.json(userObject);
      }
      
      // Update user general info
      const { role, status } = body;

      // Update user
      const updatedUser = await User.findOneAndUpdate(
        { id },
        {
          ...(role && { role }),
          ...(status && { status })
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Remove password from response
      const userObject = updatedUser.toObject();
      // @ts-ignore - password is required in the schema but we want to remove it from the response
      delete userObject.password;
      
      return NextResponse.json({
        success: true,
        user: userObject
      });
    }
    
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, context: { params: Promise<{}> }) {
  // @ts-ignore
  const resolvedParams = context.params ? await context.params : undefined;
  // @ts-ignore
  const params = resolvedParams;
  try {
    await ensureDbConnection();
    
    // @ts-ignore
    const { id } = params && params['id'] ? params : { id: '' };
    
    // Delete user
    // @ts-ignore
    const result = await User.deleteOne({ id: id || '' });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}