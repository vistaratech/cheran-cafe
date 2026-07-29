import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  restaurantId: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  payphoneTransactionId?: string;
  clientTransactionId?: string;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  amount: number;
  currency: string;
  paymentMethod?: 'card' | 'payphone';
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriptionSchema: Schema = new Schema({
  restaurantId: { type: String, required: true, index: true },
  plan: {
    type: String,
    required: true,
    enum: ['free', 'pro']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  payphoneTransactionId: { type: String },
  clientTransactionId: { type: String },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' },
  paymentMethod: {
    type: String,
    enum: ['card', 'payphone']
  }
}, {
  timestamps: true
});

// Index para búsquedas rápidas
SubscriptionSchema.index({ restaurantId: 1, status: 1 });
SubscriptionSchema.index({ clientTransactionId: 1 }, { unique: true });

// Método para cancelar suscripción
SubscriptionSchema.methods.cancel = function(reason?: string) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Método para activar suscripción
SubscriptionSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Método para establecer fecha de fin
SubscriptionSchema.methods.setEndDate = function(endDate: Date) {
  this.endDate = endDate;
  return this.save();
};

// Prevent model recompilation in development mode
const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema, 'subscriptions');
export default Subscription;
