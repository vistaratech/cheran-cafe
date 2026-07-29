import mongoose, { Schema, Document } from 'mongoose';
import { OrderItem } from '../lib/types';

export interface IOrder extends Document {
  id: number;
  restaurantId: string;
  table: string;
  customerName?: string;
  staffName?: string;
  items: OrderItem[];
  status: 'pending' | 'completed';
  statusHistory?: { status: 'pending' | 'completed'; timestamp: Date }[];
  isPinned?: boolean;
  position?: number;
  createdAt: Date;
  completedAt?: Date;
}

const OrderItemSchema: Schema = new Schema({
  id: { type: String, required: true },
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  selectedExtras: { type: [String], default: [] },
  notes: { type: String, default: '' },
  // Status field for workstation workflow
  status: { type: String, default: 'new', required: true },
  // Track which workstation this item belongs to
  workstationId: { type: String, default: null },
  // Position field for ordering items
  position: { type: Number, default: 0 }
});

const OrderSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  table: { type: String, required: true },
  customerName: { type: String },
  staffName: { type: String },
  items: { type: [OrderItemSchema], required: true },
  status: { type: String, required: true },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date }
  }],
  isPinned: { type: Boolean, default: false },
  position: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
  completedAt: { type: Date }
});

// Add indexes for better query performance
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ table: 1 });
OrderSchema.index({ isPinned: -1, createdAt: 1 });
OrderSchema.index({ position: 1 });

// Prevent model recompilation in development mode
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema, 'orders');
export default Order;