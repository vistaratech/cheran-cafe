import { NextResponse } from 'next/server';
import Role from '../../../../models/Role';
import User from '../../../../models/User';
import mongoose from 'mongoose';

async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    await mongoose.connect(MONGODB_URI);
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();

    const { id } = await params;
    const body = await request.json();

    const updatedRole = await Role.findOneAndUpdate(
      { id },
      {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.permissions !== undefined && { permissions: body.permissions }),
        ...(body.allowedWorkstations !== undefined && { allowedWorkstations: body.allowedWorkstations }),
      },
      { new: true }
    );

    if (!updatedRole) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbConnection();

    const { id } = await params;

    // Prevent deletion if users are assigned this role
    const roleDoc = await Role.findOne({ id });
    if (roleDoc) {
      const usersWithRole = await User.findOne({ role: roleDoc.name });
      if (usersWithRole) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete role that is assigned to users' },
          { status: 400 }
        );
      }
    }

    const deletedRole = await Role.findOneAndDelete({ id });

    if (!deletedRole) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 });
  }
}
