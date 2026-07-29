import mongoose, { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  username?: string;
  email?: string;
  password: string;
  googleId?: string;
  restaurantId?: string; // ownerId of the restaurant this user belongs to (staff only)
  role: 'Owner' | 'Admin' | 'Staff' | string; // Extended to allow custom roles
  status: 'On Shift' | 'Off Shift' | 'On Break';
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: false, default: null, unique: false },
  email: { type: String, required: false, default: null, sparse: true, unique: true },
  password: { type: String, required: false, default: null },
  googleId: { type: String, required: false, default: null },
  restaurantId: { type: String, required: false, default: null },
  role: {
    type: String,
    required: true
    // Removed enum constraint to allow custom roles
  },
  status: {
    type: String,
    required: true,
    enum: ['On Shift', 'Off Shift', 'On Break']
  }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Prevent model recompilation in development mode
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
export default User;