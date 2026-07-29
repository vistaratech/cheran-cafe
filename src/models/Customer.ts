import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  id: string;
  restaurantId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
}

const CustomerSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  loyaltyPoints: { type: Number, default: 0 }
});

// Prevent model recompilation in development mode
const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema, 'customers');
export default Customer;