/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-useless-catch */
/* eslint-disable no-case-declarations */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Statics, StreamStatics } from './statics-model';
import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { CustomRequest } from '../../../interfaces/common';
import fs from 'fs';
import csv from 'csv-parser';
import dayjs from 'dayjs';
import { Video } from '../videos/videos.model';
import { Request, Response } from 'express';
import { PrimaryArtist } from '../primary-artist/primary-artist.model';
import { Label } from '../label/label.model';
import { logger } from '../../../shared/logger';

import {
  getUserISRC,
  getUserISRCs,
  getUserLabels,
  getUserVideoLabel,
  getUserVideoLink,
} from './isrcs';
import User from '../user/user.model';
import axios from 'axios';

import { Amount, Payment } from '../payments/payments.model';
import { TotalCountsResponse } from './statics.utils';
import config from '../../../config';

// ---------------------------------------------------------------------------
// CUTOFF DATE
// Records with createdAt < REVENUE_RATE_CUTOFF  → show raw revenue as-is
// Records with createdAt >= REVENUE_RATE_CUTOFF → apply (revenueRate / 100)
// Set to the moment this change was deployed so existing data is untouched.
// ---------------------------------------------------------------------------
const REVENUE_RATE_CUTOFF = new Date('2026-05-10T00:00:00.000Z');

const getArtistAndLabelGrowthData = async (req: Request, res: Response) => {
  try {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear + 1, 0, 1);

    const artistCounts = await aggregateCounts(
      PrimaryArtist,
      startDate,
      endDate,
    );
    const labelCounts = await aggregateCounts(Label, startDate, endDate);

    const getCountForMonth = (counts: any[], month: number) => {
      const monthData = counts.find(data => data._id.month === month);
      return monthData ? monthData.count : 0;
    };

    const growthData = months.map((month, index) => ({
      year: currentYear,
      month,
      artistGrowth: getCountForMonth(artistCounts, index + 1),
      labelGrowth: getCountForMonth(labelCounts, index + 1),
    }));

    return {
      statusCode: 200,
      success: true,
      message: 'Data retrieved successfully',
      data: { growthData },
    };
  } catch (error: any) {
    logger.error(error);
    return {
      statusCode: 500,
      success: false,
      message: 'An error occurred while retrieving data',
      error: error.message,
    };
  }
};

const getMusicGrowthData = async (req: Request, res: Response) => {
  const date = req.query.date;
  //@ts-ignore
  const currentYear = date ? dayjs(date).year() : dayjs().year();

  try {
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear + 1, 0, 1);

    const aggregateCounts = async (model: any) => {
      return await model.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);
    };

    const albumCounts = await aggregateCounts(Album);
    const singleTrackCounts = await aggregateCounts(SingleTrack);
    const videoCounts = await aggregateCounts(Video);

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const allMonths = Array.from({ length: 12 }, (v, i) => ({
      year: currentYear,
      month: i + 1,
      monthName: months[i],
    }));

    const mapCountsToMonths = (counts: any[]) => {
      return allMonths.map(({ year, month, monthName }) => {
        const countObj = counts.find(
          c => c._id.year === year && c._id.month === month,
        ) || { count: 0 };
        return { month: monthName, count: countObj.count };
      });
    };

    const albumData = mapCountsToMonths(albumCounts);
    const singleTrackData = mapCountsToMonths(singleTrackCounts);
    const videoData = mapCountsToMonths(videoCounts);

    const analytics = allMonths.map(({ year, month, monthName }) => {
      const albumCount = albumData.find(m => m.month === monthName)?.count || 0;
      const singleTrackCount =
        singleTrackData.find(m => m.month === monthName)?.count || 0;
      const videoCount = videoData.find(m => m.month === monthName)?.count || 0;

      return {
        year,
        month: monthName,
        SingleTrackCount: singleTrackCount,
        AlbumCount: albumCount,
        VideoCount: videoCount,
      };
    });

    return {
      statusCode: 200,
      success: true,
      message: 'Data retrieved successfully',
      data: { analytics },
    };
  } catch (error: any) {
    logger.error(error);
    return {
      statusCode: 500,
      success: false,
      message: 'An error occurred while retrieving data',
      error: error.message,
    };
  }
};

const aggregateCounts = async (model: any, startDate: Date, endDate: Date) => {
  return await model.aggregate([
    { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);
};

const formatDate = (dateString: string): string | undefined => {
  if (!dateString) return undefined;
  const [month, day, year] = dateString.split('/');
  return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
};

const normalizeMonthInput = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;

  const fullMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (fullMatch) {
    const [, y, m, d] = fullMatch;
    return `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
  }

  const monthMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})$/);
  if (monthMatch) {
    const [, y, m] = monthMatch;
    return `${y}/${m.padStart(2, '0')}/01`;
  }

  const legacyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (legacyMatch) {
    const [, m, d, y] = legacyMatch;
    return `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
  }

  return undefined;
};

const insertIntoDB = async (req: CustomRequest) => {
  if (!req.files) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Files cannot be empty');
  }

  const statics = req.files['statics'];

  if (
    !statics ||
    !statics.length ||
    !statics[0].originalname.endsWith('.csv')
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid file format. Only .csv files are allowed.',
    );
  }

  const reportingMonth = normalizeMonthInput((req.body as any)?.reportingMonth);
  const salesMonth = normalizeMonthInput((req.body as any)?.salesMonth);

  if (!reportingMonth) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Reporting month is required.');
  }
  if (!salesMonth) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Sales month is required.');
  }

  const fileUrl = statics[0].location;
  //@ts-ignore
  const fieldname = statics[0].fieldname;
  const filename = statics[0].originalname;

  await new Promise<void>((resolve, reject) => {
    const results: any[] = [];

    axios({ method: 'get', url: fileUrl, responseType: 'stream' })
      .then(response => {
        response.data
          .pipe(csv({ separator: ',' }))
          .on('data', (data: any) => {
            const normalizedData = {} as any;
            for (const key in data) {
              const normalizedKey = key.trim().toLowerCase();
              normalizedData[normalizedKey] = data[key]?.trim();
            }

            results.push({
              isrc: normalizedData['isrc'],
              artistName: normalizedData['artist'],
              album: normalizedData['title'],
              releaseTitle: normalizedData['title'],
              trackTitle: normalizedData['title'],
              country: normalizedData['country code'],
              platForm: normalizedData['source'],
              totalStreams: normalizedData['all streams'],
              stream_quantity: normalizedData['all streams'],
              perStreameRate: normalizedData['per stream rate'],
              grossRevenue: normalizedData['gross'],
              revenue: normalizedData['gross'],
              reportingMonth,
              salesMonth,
            });
          })
          .on('end', async () => {
            try {
              await Statics.insertMany({ filename, fieldname, data: results });
              resolve();
            } catch (error: any) {
              reject(
                new ApiError(
                  httpStatus.BAD_REQUEST,
                  `Final Insert Error: ${error.message}`,
                ),
              );
            }
          })
          .on('error', (error: { message: any }) => {
            reject(
              new ApiError(
                httpStatus.BAD_REQUEST,
                `CSV Parse Error: ${error.message}`,
              ),
            );
          });
      })
      .catch(error => {
        reject(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `File Download Error: ${error.message}`,
          ),
        );
      });
  });
};

const generateAnalytics = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { month, year } = query;

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  const userISRCs = await getUserISRCs(userId);

  const statistics = await Statics.aggregate([
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    {
      $group: {
        _id: '$data.platForm',
        totalStreams: { $sum: { $toInt: '$data.stream_quantity' } },
        totalRevenue: { $sum: { $toDouble: '$data.revenue' } },
        clientShareRate: { $first: '$data.clientShareRate' },
      },
    },
  ]);

  //@ts-ignore
  const monthlyData = [];
  //@ts-ignore
  const yearlyData = [];

  statistics.forEach(stat => {
    const platform = stat._id;
    const totalStreams = stat.totalStreams;
    const totalRevenue = stat.totalRevenue;
    const clientShareRate = stat.clientShareRate?.slice(0, 4);

    monthlyData.push({
      name: platform,
      value: totalRevenue,
      totalStreams,
      clientShareRate,
    });
    yearlyData.push({
      name: platform,
      value: totalRevenue,
      totalStreams,
      clientShareRate,
    });
  });

  return {
    //@ts-ignore
    monthly: monthlyData,
    //@ts-ignore
    yearly: yearlyData,
  };
};

const generateAnalyticsByTractile = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { month, year } = query;

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  const userISRCs = await getUserISRCs(userId);

  const statistics = await Statics.aggregate([
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    {
      $group: {
        _id: {
          releaseTitle: '$data.releaseTitle',
          artistName: '$data.artistName',
          album: '$data.album',
          isrc: '$data.isrc',
        },
        totalStreams: { $sum: { $toInt: '$data.stream_quantity' } },
        totalRevenue: { $sum: { $toDecimal: '$data.revenue' } },
        clientShareRate: { $first: '$data.clientShareRate' },
      },
    },
    {
      $project: {
        _id: 0,
        releaseTitle: '$_id.releaseTitle',
        artistName: '$_id.artistName',
        album: '$_id.album',
        isrc: '$_id.isrc',
        totalStreams: 1,
        totalRevenue: { $toString: '$totalRevenue' },
        clientShareRate: { $substr: ['$clientShareRate', 0, 5] },
      },
    },
  ]);

  const monthlyData: any[] = [];
  const yearlyData: any[] = [];

  statistics.forEach(stat => {
    const platform = stat.releaseTitle;
    const totalStreams = stat.totalStreams;
    const totalRevenue = parseFloat(stat.totalRevenue);
    const clientShareRate = stat.clientShareRate;

    monthlyData.push({
      name: platform,
      artistName: stat.artistName,
      album: stat.album,
      isrc: stat.isrc,
      Revenue: totalRevenue.toFixed(2),
      totalStreams,
      clientShareRate,
    });

    yearlyData.push({
      name: platform,
      artistName: stat.artistName,
      album: stat.album,
      isrc: stat.isrc,
      Revenue: totalRevenue.toFixed(2),
      totalStreams,
      clientShareRate,
    });
  });

  return { monthly: monthlyData, yearly: yearlyData };
};

const generateStreamsAnalyticsByLabel = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { month, year } = query;

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  const userLabels = await getUserLabels(userId);

  const statistics = await StreamStatics.aggregate([
    {
      $match: {
        'data.labelName': { $in: userLabels },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.labelName': { $in: userLabels },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    {
      $group: {
        _id: '$data.releaseTitle',
        totalStreams: { $sum: { $toInt: '$data.stream_quantity' } },
        totalRevenue: { $sum: { $toDecimal: '$data.revenue' } },
        clientShareRate: { $first: '$data.clientShareRate' },
      },
    },
    {
      $project: {
        _id: 1,
        totalStreams: 1,
        totalRevenue: { $toString: '$totalRevenue' },
        clientShareRate: { $substr: ['$clientShareRate', 0, 5] },
      },
    },
  ]);

  //@ts-ignore
  const monthlyData = [];
  //@ts-ignore
  const yearlyData = [];

  statistics.forEach(stat => {
    const platform = stat._id;
    const totalStreams = stat.totalStreams;
    const totalRevenue = parseFloat(stat.totalRevenue);
    const clientShareRate = stat.clientShareRate;

    monthlyData.push({
      name: platform,
      value: totalRevenue.toFixed(2),
      totalStreams,
      clientShareRate,
    });
    yearlyData.push({
      name: platform,
      value: totalRevenue.toFixed(2),
      totalStreams,
      clientShareRate,
    });
  });

  return {
    //@ts-ignore
    monthly: monthlyData,
    //@ts-ignore
    yearly: yearlyData,
  };
};

// ---------------------------------------------------------------------------
// Helper: getUserRevenueRate
// ---------------------------------------------------------------------------
const getUserRevenueRate = async (userId: string): Promise<number> => {
  const user = await User.findById(userId).select('revenueRate').lean();
  const raw = (user as any)?.revenueRate;
  const rate = Number(raw);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
};

// ---------------------------------------------------------------------------
// Helper: build a $cond expression that returns the correct per-row revenue.
//
//   • doc.createdAt < CUTOFF  →  use raw revenue  (factor = 1)
//   • doc.createdAt >= CUTOFF →  use revenue × (revenueRate / 100)
//
// `revenueField` is the dotted path inside $data, e.g. "$data.revenue"
// ---------------------------------------------------------------------------
const buildRevenueExpr = (revenueField: string, revenueRate: number) => {
  const factor = revenueRate / 100;
  return {
    $cond: {
      if: { $lt: ['$createdAt', REVENUE_RATE_CUTOFF] },
      then: { $toDouble: { $ifNull: [revenueField, 0] } },
      else: {
        $multiply: [{ $toDouble: { $ifNull: [revenueField, 0] } }, factor],
      },
    },
  };
};

// ---------------------------------------------------------------------------
// generateFinancialAnalytics  (CHANGED)
// ---------------------------------------------------------------------------
const generateFinancialAnalytics = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { year } = query;

  const parsedYear = parseInt(year, 10);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthlyData = months.map(month => ({
    year: parsedYear,
    month,
    amount: 0,
  }));

  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  // Use a conditional expression so old docs keep raw revenue and new docs
  // get the share-rate factor applied.
  const revenueExpr = buildRevenueExpr('$data.revenue', revenueRate);

  const statistics = await Statics.aggregate([
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': { $regex: new RegExp(`^${parsedYear}`) },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': { $regex: new RegExp(`^${parsedYear}`) },
      },
    },
    {
      $group: {
        _id: { month: { $substrCP: ['$data.reportingMonth', 5, 2] } },
        // Sum the conditionally-factored revenue per document
        totalRevenue: { $sum: revenueExpr },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  statistics.forEach(stat => {
    const index = parseInt(stat._id.month) - 1;
    monthlyData[index].amount = Number(stat.totalRevenue) || 0;
  });

  return monthlyData;
};

// ---------------------------------------------------------------------------
// getAllTimeTotalRevenue  (unchanged — not in the required list)
// ---------------------------------------------------------------------------
const getAllTimeTotalRevenue = async (req: Request) => {
  const { userId } = req.user as any;
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const statistics = await Statics.aggregate([
    { $unwind: '$data' },
    { $match: { 'data.isrc': { $in: userISRCs } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $toDouble: '$data.revenue' } },
      },
    },
  ]);

  if (statistics.length === 0) {
    return { totalRevenue: 0, clientTotalBalance: 0, revenueRate };
  }

  const grossSum = Number(statistics[0].totalRevenue) || 0;
  const factor = revenueRate / 100;
  const shareApplied = grossSum * factor;

  return {
    totalRevenue: shareApplied,
    clientTotalBalance: shareApplied,
    revenueRate,
  };
};

const getCorrectionRequestAlbum = async (id: string) => {
  const albums = await Album.find({ user: id }).lean();
  if (!albums) throw new ApiError(404, 'Album not found');
  const albumsWithIsFalse = albums.filter(album => {
    //@ts-ignore
    return album.correctionNote.some(note => !note.isRead);
  });
  return albumsWithIsFalse;
};

const getCorrectionRequestSingle = async (id: string) => {
  const singleSongs = await SingleTrack.find({ user: id }).lean();
  if (!singleSongs) throw new ApiError(404, 'Song not found');
  const singleSongsWithIsFalse = singleSongs.filter(singleSong => {
    //@ts-ignore
    return singleSong.correctionNote.some(note => !note.isRead);
  });
  return singleSongsWithIsFalse;
};

const lastSixApprovedTracks = async (id: string) => {
  const latestSix = await SingleTrack.find({ user: id, isApproved: 'approved' })
    .sort({ createdAt: 'desc' })
    .limit(6);
  return latestSix;
};

// ---------------------------------------------------------------------------
// Helpers shared by revenueByTitle / revenueByCountry / revenueByPlatform
// ---------------------------------------------------------------------------

const requireMonthYear = (req: Request) => {
  const month = parseInt(((req.query as any)?.month ?? '') as string, 10);
  const year = parseInt(((req.query as any)?.year ?? '') as string, 10);
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or missing month');
  }
  if (!Number.isFinite(year) || year < 1900 || year > 2999) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or missing year');
  }
  return { month, year };
};

const buildPeriodMatch = (
  userISRCs: string[],
  month: number,
  year: number,
) => ({
  'data.isrc': { $in: userISRCs },
  'data.reportingMonth': {
    $regex: new RegExp(`^${year}/${month.toString().padStart(2, '0')}`),
  },
});

// ---------------------------------------------------------------------------
// groupRevenueBy  (CHANGED)
//
// Instead of a plain $sum on revenue, we use buildRevenueExpr so that the
// factor is applied only to documents whose createdAt >= CUTOFF.
// ---------------------------------------------------------------------------
const groupRevenueBy = async (
  userISRCs: string[],
  month: number,
  year: number,
  groupExpr: any,
  revenueRate: number,
  extra: Record<string, any> = {},
) => {
  const match = buildPeriodMatch(userISRCs, month, year);
  const revenueExpr = buildRevenueExpr('$data.revenue', revenueRate);

  return Statics.aggregate([
    { $match: match },
    { $unwind: '$data' },
    { $match: match },
    {
      $group: {
        _id: groupExpr,
        totalStreams: {
          $sum: { $toDouble: { $ifNull: ['$data.totalStreams', 0] } },
        },
        legacyStreams: {
          $sum: { $toDouble: { $ifNull: ['$data.stream_quantity', 0] } },
        },
        grossRevenue: {
          $sum: { $toDouble: { $ifNull: ['$data.grossRevenue', 0] } },
        },
        // revenueSum now holds the cutoff-aware amount (no post-processing needed)
        revenueSum: { $sum: revenueExpr },
        ...extra,
      },
    },
  ]);
};

// ---------------------------------------------------------------------------
// finalizeRows  (CHANGED)
//
// revenueSum already has the correct value (raw for old docs, factored for new).
// We no longer multiply by factor here — that would double-apply it on new docs.
// ---------------------------------------------------------------------------
const finalizeRows = (
  rows: any[],
  revenueRate: number,
  toRow: (r: any) => Record<string, any>,
) => {
  const enriched = rows
    .map(r => {
      const totalStreams =
        Number(r.totalStreams) || Number(r.legacyStreams) || 0;
      const grossRevenue = Number(r.grossRevenue) || 0;
      // revenueSum is already the share-applied (or raw, for old docs) value
      const totalRevenue = Number(r.revenueSum) || 0;
      const rpm = totalStreams > 0 ? (totalRevenue / totalStreams) * 1000 : 0;
      return { ...toRow(r), totalStreams, grossRevenue, totalRevenue, rpm };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totals = enriched.reduce(
    (acc, cur) => {
      acc.totalStreams += cur.totalStreams;
      acc.grossRevenue += cur.grossRevenue;
      acc.totalRevenue += cur.totalRevenue;
      return acc;
    },
    { totalStreams: 0, grossRevenue: 0, totalRevenue: 0, rpm: 0 },
  );
  totals.rpm =
    totals.totalStreams > 0
      ? (totals.totalRevenue / totals.totalStreams) * 1000
      : 0;

  return { rows: enriched, totals, revenueRate };
};

// ---------------------------------------------------------------------------
// revenueByTitle  (CHANGED — passes revenueRate into groupRevenueBy)
// ---------------------------------------------------------------------------
const revenueByTitle = async (req: Request) => {
  const { userId } = req.user as any;
  const { month, year } = requireMonthYear(req);
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const rows = await groupRevenueBy(
    userISRCs,
    month,
    year,
    {
      isrc: '$data.isrc',
      title: '$data.releaseTitle',
      artist: '$data.artistName',
    },
    revenueRate,
    {
      title: { $first: '$data.releaseTitle' },
      artist: { $first: '$data.artistName' },
      isrc: { $first: '$data.isrc' },
    },
  );

  return finalizeRows(rows, revenueRate, r => ({
    isrc: r.isrc || r._id?.isrc || '',
    title: r.title || r._id?.title || '',
    artist: r.artist || r._id?.artist || '',
    name: r.title || r._id?.title || '',
  }));
};

// ---------------------------------------------------------------------------
// revenueByCountry  (CHANGED — passes revenueRate into groupRevenueBy)
// ---------------------------------------------------------------------------
const revenueByCountry = async (req: Request) => {
  const { userId } = req.user as any;
  const { month, year } = requireMonthYear(req);
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const rows = await groupRevenueBy(
    userISRCs,
    month,
    year,
    '$data.country',
    revenueRate,
  );

  return finalizeRows(rows, revenueRate, r => ({
    countryCode: (r._id || '').toString().trim().toUpperCase(),
    name: (r._id || '').toString().trim().toUpperCase(),
  }));
};

// ---------------------------------------------------------------------------
// revenueByPlatform  (CHANGED — passes revenueRate into groupRevenueBy)
// ---------------------------------------------------------------------------
const revenueByPlatform = async (req: Request) => {
  const { userId } = req.user as any;
  const { month, year } = requireMonthYear(req);
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const rows = await groupRevenueBy(
    userISRCs,
    month,
    year,
    '$data.platForm',
    revenueRate,
  );

  return finalizeRows(rows, revenueRate, r => ({
    platform: (r._id || '').toString().trim(),
    name: (r._id || '').toString().trim(),
  }));
};

const getAllIsrcs = async () => {
  const isrcs = await getUserISRC();
  return isrcs;
};

const getFiles = async () => {
  const files = await Statics.aggregate([
    {
      $group: {
        _id: { filename: '$filename', createdAt: '$createdAt', id: '$_id' },
      },
    },
    {
      $project: {
        _id: '$_id.id',
        filename: '$_id.filename',
        createdAt: '$_id.createdAt',
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return files;
};

// ---------------------------------------------------------------------------
// myCurrentMonthBalance  (CHANGED)
// ---------------------------------------------------------------------------
const myCurrentMonthBalance = async (req: Request) => {
  const { userId } = req.user as any;
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const revenueExpr = buildRevenueExpr('$data.revenue', revenueRate);

  const statistics = await Statics.aggregate([
    { $unwind: '$data' },
    { $match: { 'data.isrc': { $in: userISRCs } } },
    {
      $group: {
        _id: null,
        // Per-document conditional: old → raw, new → factored
        totalRevenue: { $sum: revenueExpr },
        reportingMonth: { $first: '$data.reportingMonth' },
      },
    },
  ]);

  const shareRevenue =
    statistics.length > 0 ? Number(statistics[0].totalRevenue) || 0 : 0;

  const isExistAmount = await Amount.findOne({ user: userId });
  const isExistPayment = await Payment.find({ user: userId });

  const previousTotalAmount = isExistPayment.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  if (!isExistAmount) {
    const newAmount = await Amount.create({
      user: userId,
      amount: shareRevenue,
      month: currentMonth,
      year: currentYear,
    });
    return {
      totalRevenue: newAmount.amount,
      clientTotalBalance: newAmount.amount,
      revenueRate,
    };
  } else {
    isExistAmount.amount = shareRevenue - previousTotalAmount;
    await isExistAmount.save();
    return {
      totalRevenue: isExistAmount.amount,
      clientTotalBalance: isExistAmount.amount,
      revenueRate,
    };
  }
};

// ---------------------------------------------------------------------------
// myFullMonthBalance  (unchanged — not in the required list)
// ---------------------------------------------------------------------------
const myFullMonthBalance = async (req: Request) => {
  const { userId } = req.user as any;
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const statistics = await Statics.aggregate([
    { $match: { 'data.isrc': { $in: userISRCs } } },
    { $unwind: '$data' },
    { $match: { 'data.isrc': { $in: userISRCs } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $toDouble: '$data.revenue' } },
      },
    },
  ]);

  const grossSum =
    statistics.length > 0 ? Number(statistics[0].totalRevenue) || 0 : 0;
  const factor = revenueRate / 100;
  const clientTotalBalance = grossSum * factor;

  return { totalRevenue: clientTotalBalance, clientTotalBalance, revenueRate };
};

const deleteFiles = async (filename: string) => {
  const result = await Statics.findOneAndDelete({ filename });
  return result;
};

const lastSixApprovedLabel = async () => {
  const latestSix = await Label.find({})
    .populate('user')
    .sort({ createdAt: 'desc' })
    .limit(6);
  return latestSix;
};

const latestArtists = async () => {
  const latestSix = await PrimaryArtist.find({})
    .sort({ createdAt: 'desc' })
    .limit(6);
  return latestSix;
};

// ---------------------------------------------------------------------------
// generateFinancialRevenueAnalytics  (CHANGED)
// ---------------------------------------------------------------------------
const generateFinancialRevenueAnalytics = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { month, year } = query;

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const revenueExpr = buildRevenueExpr('$data.revenue', revenueRate);

  const statistics = await Statics.aggregate([
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    {
      $group: {
        _id: '$data.platForm',
        amount: { $sum: revenueExpr },
      },
    },
  ]);

  const monthlyData = statistics.map(stat => ({
    name: stat._id,
    value: Number(stat.amount) || 0,
  }));

  return monthlyData;
};

// ---------------------------------------------------------------------------
// generateFinancialRevenueAnalyticsByCountry  (unchanged — not in required list)
// ---------------------------------------------------------------------------
const generateFinancialRevenueAnalyticsByCountry = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { month, year } = query;

  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    //@ts-ignore
    getUserRevenueRate(userId),
  ]);

  const statistics = await Statics.aggregate([
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    { $unwind: '$data' },
    {
      $match: {
        'data.isrc': { $in: userISRCs },
        'data.reportingMonth': {
          $regex: new RegExp(
            `^${parsedYear}/${parsedMonth.toString().padStart(2, '0')}`,
          ),
        },
      },
    },
    {
      $group: {
        _id: '$data.country',
        amount: { $sum: { $toDouble: '$data.revenue' } },
      },
    },
  ]);

  const factor = revenueRate / 100;
  const monthlyData = statistics.map(stat => ({
    name: stat._id,
    value: (Number(stat.amount) || 0) * factor,
  }));

  return monthlyData;
};

// ---------------------------------------------------------------------------
// getMyDataFromFiles  (CHANGED)
// ---------------------------------------------------------------------------
const getMyDataFromFiles = async (req: Request) => {
  try {
    const { userId } = req.user as any;
    const [userISRCs, revenueRate] = await Promise.all([
      getUserISRCs(userId),
      getUserRevenueRate(userId),
    ]);

    const files = await Statics.find(
      { 'data.isrc': { $in: userISRCs } },
      { filename: 1, createdAt: 1 },
    );

    if (!files || files.length === 0) return null;

    const results = await Promise.all(
      files.map(async file => {
        // Determine factor for this specific file based on its createdAt
        const isOldDoc = (file as any).createdAt < REVENUE_RATE_CUTOFF;
        const factor = isOldDoc ? 1 : revenueRate / 100;

        const [data, totalCount] = await Promise.all([
          Statics.aggregate([
            { $match: { _id: file._id } },
            { $unwind: '$data' },
            { $match: { 'data.isrc': { $in: userISRCs } } },
            {
              $group: {
                _id: null,
                data: { $push: '$data' },
                count: { $sum: 1 },
                totalRevenue: { $sum: { $toDouble: '$data.revenue' } },
                totalGrossRevenue: {
                  $sum: { $toDouble: { $ifNull: ['$data.grossRevenue', 0] } },
                },
                reportingMonth: { $first: '$data.reportingMonth' },
              },
            },
            {
              $project: {
                _id: 0,
                data: 1,
                count: 1,
                totalRevenue: 1,
                totalGrossRevenue: 1,
                reportingMonth: 1,
              },
            },
          ]),
          Statics.countDocuments({
            _id: file._id,
            'data.isrc': { $in: userISRCs },
          }),
        ]);

        const agg = data.length > 0 ? data[0] : null;
        const grossSum = Number(agg?.totalRevenue) || 0;
        const grossRevenueSum = Number(agg?.totalGrossRevenue) || 0;

        // Old files: show exact revenue; new files: apply share rate
        const shareApplied = grossSum * factor;

        return {
          _id: file._id,
          filename: file.filename,
          totalCount,
          // For old files this will be 100 (raw), for new files it is the actual rate
          clientShareRate: isOldDoc ? 100 : revenueRate,
          revenueRate: isOldDoc ? 100 : revenueRate,
          reportingMonth: agg?.reportingMonth,
          objectCounts: agg?.count ?? 0,
          totalAmount: shareApplied,
          totalGrossRevenue: grossRevenueSum,
          totalGrossAmount: grossSum,
          createdAt: (file as any).createdAt,
          data: agg?.data ?? [],
        };
      }),
    );

    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  } catch (error) {
    logger.error('Error in getMyDataFromFiles:', error);
    throw error;
  }
};

const testFile = async () => {
  return await Statics.find();
};

const totalCounts = async (req: Request): Promise<TotalCountsResponse> => {
  try {
    const { userId } = req.user as any;

    const queries = {
      totalAudio: SingleTrack.countDocuments({ user: userId }),
      totalVideo: Video.countDocuments({ user: userId }),
      totalPendingAudio: SingleTrack.countDocuments({
        user: userId,
        isApproved: 'pending',
        songStatus: 'none',
        isCorrection: false,
      }),
      totalPendingVideo: Video.countDocuments({
        user: userId,
        isApproved: 'pending',
        videoStatus: 'none',
        isCorrection: false,
      }),
      totalApprovedAudio: SingleTrack.countDocuments({
        user: userId,
        isApproved: 'approved',
        songStatus: 'none',
        isCorrection: false,
      }),
      totalApprovedVideo: Video.countDocuments({
        user: userId,
        isApproved: 'approved',
        videoStatus: 'none',
        isCorrection: false,
      }),
    };

    const [
      totalAudio,
      totalVideo,
      totalPendingAudio,
      totalPendingVideo,
      totalApprovedAudio,
      totalApprovedVideo,
    ] = await Promise.all([
      queries.totalAudio,
      queries.totalVideo,
      queries.totalPendingAudio,
      queries.totalPendingVideo,
      queries.totalApprovedAudio,
      queries.totalApprovedVideo,
    ]);

    return {
      totalSongs: totalAudio + totalVideo,
      totalPendingSongs: totalPendingAudio + totalPendingVideo,
      totalApprovedSongs: totalApprovedAudio + totalApprovedVideo,
    };
  } catch (error) {
    logger.error('Error fetching total counts:', error);
    throw new Error('Unable to fetch total counts');
  }
};

const UploadStreamFile = async (req: Request) => {
  try {
    const { files } = req;

    //@ts-ignore
    if (!files || !files['statics']) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
    }
    //@ts-ignore
    const statics = files['statics'];

    if (
      !statics ||
      !statics.length ||
      !statics[0].originalname.endsWith('.csv')
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invalid file format. Only .csv files are allowed.',
      );
    }

    const fileUrl = statics[0].location;
    const filename = statics[0].originalname;
    const fieldname = statics[0].fieldname;

    await new Promise<void>((resolve, reject) => {
      const results: any[] = [];

      axios({ method: 'get', url: fileUrl, responseType: 'stream' })
        .then(response => {
          response.data
            .pipe(csv({ separator: ',' }))
            .on('data', (data: any) => {
              if (
                data['Streams (daily)'] &&
                data['Streams (daily)'].includes('/')
              ) {
                const dateRange = data['Streams (daily)'];
                const totalStreams = parseFloat(data['Total']);
                if (dateRange && !isNaN(totalStreams)) {
                  results.push({ dateRange, totalStreams });
                } else {
                  logger.warn('Skipping invalid date range row:', data);
                }
              } else if (
                data['Streams (daily)'] &&
                !isNaN(parseFloat(data['Total']))
              ) {
                const labelName = data['Streams (daily)'];
                const streams = parseFloat(data['Total']);
                if (labelName && !isNaN(streams)) {
                  results.push({ labelName, streams });
                } else {
                  logger.warn('Skipping invalid label row:', data);
                }
              } else {
                logger.warn('Skipping unknown row type:', data);
              }
            })
            .on('end', async () => {
              try {
                if (results.length > 0) {
                  await StreamStatics.insertMany({
                    filename,
                    fieldname,
                    data: results,
                  });
                  resolve();
                } else {
                  reject(
                    new ApiError(
                      httpStatus.BAD_REQUEST,
                      'No valid data found in the file.',
                    ),
                  );
                }
              } catch (error: any) {
                reject(
                  new ApiError(
                    httpStatus.INTERNAL_SERVER_ERROR,
                    `Failed to insert data into the database: ${error.message}`,
                  ),
                );
              }
            })
            .on('error', (error: { message: string }) => {
              reject(
                new ApiError(
                  httpStatus.INTERNAL_SERVER_ERROR,
                  `CSV Parse Error: ${error.message}`,
                ),
              );
            });
        })
        .catch(error => {
          reject(
            new ApiError(
              httpStatus.INTERNAL_SERVER_ERROR,
              `File Download Error: ${error.message}`,
            ),
          );
        });
    });

    return { message: 'File uploaded and data inserted successfully' };
  } catch (error) {
    logger.error('Error during file processing:', error);
  }
};

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const vevoAnalytics = async (req: Request) => {
  const query = req.query as any;
  const { userId } = req.user as any;
  const { label } = query;

  try {
    const userVideoIDS = await getUserVideoLink(userId);

    if (!userVideoIDS.length) {
      return {
        success: true,
        data: [],
        message: 'No videos found for this user',
      };
    }

    const chunks = chunkArray(userVideoIDS, 50);
    let youtubeData: any[] = [];

    for (const chunk of chunks) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}&key=${config.google_api_key}`;
      const res = await axios.get(url);
      if (res.data?.items?.length) youtubeData.push(...res.data.items);
    }

    if (!youtubeData.length) {
      return {
        success: true,
        data: [],
        message: 'No YouTube analytics available',
      };
    }

    const youtubeVideoIds = youtubeData.map(item => item.id);
    const baseQuery: any = { videoLink: { $in: youtubeVideoIds } };
    if (label) baseQuery.label = label;

    const videosFromDb = await Video.find(baseQuery).lean();

    const mergedData = videosFromDb.map(video => {
      const ytStats = youtubeData.find(yt => yt.id === video.videoLink);
      return {
        isrc: video.isrc,
        labelName: video.label,
        artistName: video.primaryArtist?.map((a: any) => a),
        title: video.title,
        videoId: video.videoLink,
        statistics: ytStats
          ? {
              viewCount: ytStats.statistics?.viewCount || '0',
              likeCount: ytStats.statistics?.likeCount || '0',
              commentCount: ytStats.statistics?.commentCount || '0',
            }
          : { viewCount: '0', likeCount: '0', commentCount: '0' },
      };
    });

    return { success: true, count: mergedData.length, data: mergedData };
  } catch (error: any) {
    logger.error('YouTube Analytics Error', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.error?.message ||
        'Failed to fetch YouTube analytics',
    );
  }
};

export const topArtistAndLabelAnalytics = async (req: Request) => {
  const { userId } = req.user as any;

  try {
    const userVideoIDS = await getUserVideoLink(userId);
    if (!userVideoIDS.length) return { top5Labels: [], top5Artists: [] };

    const chunks = chunkArray(userVideoIDS, 50);
    let youtubeData: any[] = [];

    for (const chunk of chunks) {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}&key=${config.google_api_key}`;
      const res = await axios.get(url);
      if (res.data?.items?.length) youtubeData.push(...res.data.items);
    }

    if (!youtubeData.length) return { top5Labels: [], top5Artists: [] };

    const youtubeVideoIds = youtubeData.map(item => item.id);
    const videosFromDb = await Video.find({
      videoLink: { $in: youtubeVideoIds },
    }).lean();

    const mergedData = videosFromDb.map(video => {
      const yt = youtubeData.find(item => item.id === video.videoLink);
      return {
        label: video.label,
        primaryArtist: video.primaryArtist || [],
        viewCount: Number(yt?.statistics?.viewCount || 0),
      };
    });

    const labelStats: Record<string, number> = {};
    mergedData.forEach(video => {
      if (!video.label) return;
      labelStats[video.label] =
        (labelStats[video.label] || 0) + video.viewCount;
    });
    const top5Labels = Object.entries(labelStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, totalViews]) => ({ label, totalViews }));

    const artistStats: Record<string, number> = {};
    mergedData.forEach(video => {
      video.primaryArtist.forEach((artist: string) => {
        if (!artist) return;
        artistStats[artist] = (artistStats[artist] || 0) + video.viewCount;
      });
    });
    const top5Artists = Object.entries(artistStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([artist, totalViews]) => ({ artist, totalViews }));

    return { top5Labels, top5Artists };
  } catch (error: any) {
    logger.error('Top Artist & Label Analytics Error', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(
      error.response?.data?.error?.message ||
        'Failed to fetch YouTube analytics',
    );
  }
};

const allLabels = async (req: Request) => {
  const { userId } = req.user as any;
  return await getUserVideoLabel(userId);
};

const allSongs = (req: Request) => {
  const { userId } = req.user as any;
  const single = SingleTrack.find({ user: userId }).select('createdAt');
  const video = Video.find({ user: userId }).select('createdAt');
  return Promise.all([single, video]);
};

export const StaticsService = {
  insertIntoDB,
  getAllIsrcs,
  revenueByTitle,
  revenueByCountry,
  revenueByPlatform,
  generateAnalytics,
  getCorrectionRequestAlbum,
  getCorrectionRequestSingle,
  lastSixApprovedTracks,
  getFiles,
  deleteFiles,
  generateFinancialAnalytics,
  getMusicGrowthData,
  getArtistAndLabelGrowthData,
  lastSixApprovedLabel,
  latestArtists,
  getMyDataFromFiles,
  myCurrentMonthBalance,
  getAllTimeTotalRevenue,
  generateFinancialRevenueAnalytics,
  myFullMonthBalance,
  generateAnalyticsByTractile,
  generateFinancialRevenueAnalyticsByCountry,
  testFile,
  totalCounts,
  UploadStreamFile,
  generateStreamsAnalyticsByLabel,
  vevoAnalytics,
  topArtistAndLabelAnalytics,
  allLabels,
  allSongs,
};
