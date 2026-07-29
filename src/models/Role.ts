import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  permissions: string[];
  /** workstation IDs this role can see in KDS; empty array means all workstations */
  allowedWorkstations: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  permissions: [{
    type: String,
    enum: [
      'menu_access',
      'order_management',
      'kds_access',
      'reports_access',
      'restaurant_settings',
      'user_management',
      'payment_processing',
      'inventory_management',
      'role_management'
    ]
  }],
  allowedWorkstations: [{ type: String, default: [] }]
}, {
  timestamps: true
});

RoleSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

// Prevent model recompilation in development mode
const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema, 'roles');
export default Role;