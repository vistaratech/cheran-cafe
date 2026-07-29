import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  id: string;
  name: string;
  ownerId: string;
  membership: 'free' | 'pro';
  phone?: string;
  address?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  membership: {
    type: String,
    required: true,
    enum: ['free', 'pro'],
    default: 'free'
  },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
RestaurantSchema.pre<IRestaurant>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);