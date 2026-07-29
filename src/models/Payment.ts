import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  id: string;
  restaurantId: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer';
  enabled: boolean;
  banks?: string[];
}

const PaymentSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'bank_transfer']
  },
  enabled: { type: Boolean, required: true, default: true },
  banks: [{ type: String }]
}, {
  timestamps: true
});

// Prevent model recompilation in development mode
const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema, 'payments');
export default Payment;