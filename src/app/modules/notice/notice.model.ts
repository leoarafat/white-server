import mongoose, { Document, Schema } from 'mongoose';

export type INotice = {
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} & Document;

const NoticeSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Notice = mongoose.model('Notice', NoticeSchema);
