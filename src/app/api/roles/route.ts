import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import Role from '../../../models/Role';
import User from '../../../models/User';
import mongoose from 'mongoose';

// Helper function to ensure database connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// GET /api/roles - Get all roles for a restaurant
export async function GET(request: Request) {
  try {
    await ensureDbConnection();

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    const roles = await Role.find({ restaurantId });

    return NextResponse.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roles'
      },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: Request) {
  try {
    await ensureDbConnection();
    
    const body = await request.json();

    if (!body.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    // Check if role with this name already exists for this restaurant
    const existingRole = await Role.findOne({ name: body.name, restaurantId: body.restaurantId });

    if (existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Role with this name already exists'
        },
        { status: 400 }
      );
    }

    // Generate a unique ID
    const roleId = uuidv4();

    // Create new role object
    const roleData = {
      id: roleId,
      restaurantId: body.restaurantId,
      name: body.name,
      description: body.description,
      permissions: body.permissions || [],
      allowedWorkstations: body.allowedWorkstations || []
    };
    
    // Save to Role collection
    const newRole = new Role(roleData);
    const savedRole = await newRole.save();
    
    return NextResponse.json({ 
      success: true, 
      data: savedRole
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create role' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: Request) {
  try {
    await ensureDbConnection();
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const body = await request.json();
      
      // Update role
      const updatedRole = await Role.findOneAndUpdate(
        { id },
        { 
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.permissions && { permissions: body.permissions })
        },
        { new: true }
      );
      
      if (!updatedRole) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Role not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: updatedRole
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Role ID is required' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update role' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(request: Request) {
  try {
    await ensureDbConnection();
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      // Check if any users have this role
      const usersWithRole = await User.findOne({ role: id });
      
      if (usersWithRole) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Cannot delete role that is assigned to users' 
          },
          { status: 400 }
        );
      }
      
      // Delete role
      const deletedRole = await Role.findOneAndDelete({ id });
      
      if (!deletedRole) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Role not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Role deleted successfully'
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Role ID is required' 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete role' 
      },
      { status: 500 }
    );
  }
}