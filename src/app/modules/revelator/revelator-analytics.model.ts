import { Schema, model } from 'mongoose';
import { IRevelatorAnalytics } from './revelator-analytics.interface';

// Raw Revelator numbers only — revenueRate scaling happens at read time
// (see revelator.analytics.service.ts) so a later rate change never needs a
// backfill here. One row per (track, period granularity, period bucket).
const revelatorAnalyticsSchema = new Schema<IRevelatorAnalytics>(
  {
    track: { type: Schema.Types.ObjectId, ref: 'SingleTrack', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: { type: Date, required: true },
    streams: { type: Number, default: 0 },
    revenueGross: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

revelatorAnalyticsSchema.index(
  { track: 1, period: 1, periodStart: 1 },
  { unique: true },
);
revelatorAnalyticsSchema.index({ user: 1, period: 1, periodStart: 1 });

export const RevelatorAnalytics = model<IRevelatorAnalytics>(
  'RevelatorAnalytics',
  revelatorAnalyticsSchema,
);
