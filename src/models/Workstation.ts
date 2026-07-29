import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkstation extends Document {
  id: string;
  restaurantId: string;
  name: string;
  states: {
    new: string;
    inProgress: string;
    ready: string;
  };
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkstationSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  restaurantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  states: {
    new: { type: String, required: true, default: 'new' },
    inProgress: { type: String, required: true, default: 'in progress' },
    ready: { type: String, required: true, default: 'ready' }
  },
  position: { type: Number, default: 0, required: true }
}, {
  timestamps: true
});

WorkstationSchema.index({ restaurantId: 1, name: 1 }, { unique: true });
WorkstationSchema.index({ restaurantId: 1, position: 1, createdAt: 1 });

// Prevent model recompilation in development mode
const Workstation = mongoose.models.Workstation || mongoose.model<IWorkstation>('Workstation', WorkstationSchema, 'workstations');
export default Workstation;