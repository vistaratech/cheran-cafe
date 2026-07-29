import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  id: string; // Changed from number to string for consistency
  restaurantId: string;
  name: string;
  parentId?: string; // Changed from number to string for consistency
  isModifierGroup?: boolean;
  children?: ICategory[];
}

const CategorySchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  parentId: { type: String, required: false },
  isModifierGroup: { type: Boolean, default: false }
});

// Prevent model recompilation in development mode
const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema, 'categories');
export default Category;