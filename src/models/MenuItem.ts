import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  description?: string;
  available?: boolean;
  category: string;
  imageUrl: string;

  linkedModifiers?: string[];
  sortIndex: number;
}

const MenuItemSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  available: { type: Boolean, default: true },
  category: { type: String, required: true },
  imageUrl: { type: String, default: '' },

  linkedModifiers: [{ type: String }],
  sortIndex: { type: Number, default: 0 }
});

// Prevent model recompilation in development mode
const MenuItem = mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema, 'menuitems');
export default MenuItem;