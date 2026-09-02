import { Types } from 'mongoose';
import { RevelatorAnalytics } from './revelator-analytics.model';
import { SingleTrack } from '../single-track/single.model';
import { RevelatorAnalyticsPeriod } from './revelator-analytics.interface';
import { getUserRevenueRate } from '../statics/statics.service';

const scale = (gross: number, factor: number) =>
  Math.round(gross * factor * 100) / 100;

const getAnalytics = async (
  userId: string,
  period: RevelatorAnalyticsPeriod = 'monthly',
  from?: string,
  to?: string,
) => {
  const revenueRate = await getUserRevenueRate(userId);
  const factor = revenueRate / 100;

  const match: Record<string, unknown> = {
    user: new Types.ObjectId(userId),
    period,
  };
  if (from || to) {
    match.periodStart = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lt: new Date(to) } : {}),
    };
  }

  const rows = await RevelatorAnalytics.find(match)
    .sort({ periodStart: 1 })
    .populate('track', 'title releaseTitle')
    .lean();

  const bySeries = new Map<
    string,
    { periodStart: Date; streams: number; revenueGross: number }
  >();
  const byTrack = new Map<
    string,
    { trackId: string; title: string; streams: number; revenueGross: number }
  >();

  for (const row of rows) {
    const key = row.periodStart.toISOString();
    const seriesEntry = bySeries.get(key) || {
      periodStart: row.periodStart,
      streams: 0,
      revenueGross: 0,
    };
    seriesEntry.streams += row.streams;
    seriesEntry.revenueGross += row.revenueGross;
    bySeries.set(key, seriesEntry);

    const trackDoc = row.track as any;
    const trackId = String(trackDoc?._id || row.track);
    const trackEntry = byTrack.get(trackId) || {
      trackId,
      title: trackDoc?.title || trackDoc?.releaseTitle || 'Untitled',
      streams: 0,
      revenueGross: 0,
    };
    trackEntry.streams += row.streams;
    trackEntry.revenueGross += row.revenueGross;
    byTrack.set(trackId, trackEntry);
  }

  const series = Array.from(bySeries.values()).map(s => ({
    periodStart: s.periodStart,
    streams: s.streams,
    revenueGross: s.revenueGross,
    revenueNet: scale(s.revenueGross, factor),
  }));

  const tracks = Array.from(byTrack.values())
    .map(t => ({
      ...t,
      revenueNet: scale(t.revenueGross, factor),
    }))
    .sort((a, b) => b.revenueNet - a.revenueNet);

  const totalsGross = rows.reduce((s, r) => s + r.revenueGross, 0);
  const totalsStreams = rows.reduce((s, r) => s + r.streams, 0);

  const totalBotSentTracks = await SingleTrack.countDocuments({
    user: userId,
    revelatorStatus: 'live',
  });

  return {
    period,
    revenueRate,
    currency: rows[0]?.currency || 'USD',
    totals: {
      streams: totalsStreams,
      revenueGross: totalsGross,
      revenueNet: scale(totalsGross, factor),
    },
    series,
    tracks,
    hasBotSentTracks: totalBotSentTracks > 0,
  };
};

export const RevelatorAnalyticsService = { getAnalytics };
