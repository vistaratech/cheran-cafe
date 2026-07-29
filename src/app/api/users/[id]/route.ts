import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import User from '../../../../models/User';
import Role from '../../../../models/Role';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// GET /api/users/[id] - Get specific user
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const user = await User.findOne({ id });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from response
    const userObject = user.toObject();
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

// PUT /api/users/[id] - Update user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const body = await request.json();
    
    // Handle role update specifically
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
      delete userObject.password;
      
      return NextResponse.json({
        success: true,
        data: userObject
      });
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
    delete userObject.password;
    
    return NextResponse.json({
      success: true,
      data: userObject
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();
    
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Delete user
    const result = await User.deleteOne({ id });
    
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