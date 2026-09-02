import { Types } from 'mongoose';

export type RevelatorAnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export type IRevelatorAnalytics = {
  track: Types.ObjectId;
  user: Types.ObjectId;
  period: RevelatorAnalyticsPeriod;
  periodStart: Date;
  streams: number;
  revenueGross: number;
  currency: string;
  syncedAt: Date;
};
