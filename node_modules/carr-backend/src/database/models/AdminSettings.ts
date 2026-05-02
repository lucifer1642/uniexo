import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdminSettings extends Document {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  { timestamps: true },
);

export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', adminSettingsSchema);
