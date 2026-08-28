// models/UserBalance.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export type IUserBalance = {
  user: mongoose.Types.ObjectId;
  email: string;
  name: string;
  balance: number;
  revenueRate: number;
  lastSyncedAt: Date;
  month: number;
  year: number;
  processedStaticIds: mongoose.Types.ObjectId[]; // কোন Statics doc already counted
} & Document;

const UserBalanceSchema = new Schema<IUserBalance>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    email: { type: String, required: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 0 },
    revenueRate: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: Date.now },
    month: { type: Number },
    year: { type: Number },
    processedStaticIds: [{ type: Schema.Types.ObjectId, ref: 'Statics' }],
  },
  { timestamps: true },
);

export const UserBalance = mongoose.model<IUserBalance>(
  'UserBalance',
  UserBalanceSchema,
);
