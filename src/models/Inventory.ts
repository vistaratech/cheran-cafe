import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  id: string;
  restaurantId: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  lastRestocked: Date;
}

const InventoryItemSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reorderLevel: { type: Number, required: true },
  lastRestocked: { type: Date, required: true }
});

// Prevent model recompilation in development mode
const Inventory = mongoose.models.Inventory || mongoose.model<IInventoryItem>('Inventory', InventoryItemSchema, 'inventory');
export default Inventory;