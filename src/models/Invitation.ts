import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  token: string;
  ownerId: string;        // id of the Owner user who created the invite
  restaurantId: string;   // id of the Restaurant record
  restaurantName: string; // displayed on the registration page
  role: string;
  expiresAt: Date;
  usedAt?: Date;
}

const InvitationSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, required: true },
  role: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema, 'invitations');
