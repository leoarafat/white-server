/* eslint-disable no-useless-escape */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';

import { NextFunction, Request, Response } from 'express';
import User from '../user/user.model';
import { Video } from '../videos/videos.model';
import { B2BSongs } from './B2BSongs.model';
import { CustomRequest } from '../../../interfaces/common';
import ApiError from '../../../errors/ApiError';
import { createError } from '../../../utils/error';
import { generateUniqueVideoId } from '../../../utils/videoId';

// ----------------------------------
// HELPER FUNCTIONS
// ----------------------------------

const normalizeDescription = (text: any) => {
  if (typeof text !== 'string') return text ?? '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const toStringArray = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map(x => (x == null ? '' : String(x).trim())).filter(Boolean);
  }
  return String(v)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

// FIXED: normalizeStringArray - prevents double-stringification
const normalizeStringArray = (value: any): string[] => {
  if (!value) return [];

  // If it's already an array
  if (Array.isArray(value)) {
    const result: string[] = [];

    for (const item of value) {
      if (typeof item === 'string') {
        // If the string itself looks like a JSON array, parse it
        if (item.startsWith('[') && item.endsWith(']')) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              // Add each parsed item individually
              for (const p of parsed) {
                if (p && typeof p === 'string' && p.trim() !== '') {
                  result.push(p.trim());
                }
              }
            } else {
              if (item.trim() !== '') result.push(item.trim());
            }
          } catch {
            if (item.trim() !== '') result.push(item.trim());
          }
        } else {
          if (item.trim() !== '') result.push(item.trim());
        }
      } else if (item && typeof item === 'object') {
        // If it's an object, try to extract name
        const name =
          item.label || item.value || item.primaryArtistName || item.name;
        if (name && typeof name === 'string' && name.trim() !== '') {
          result.push(name.trim());
        }
      }
    }

    return result;
  }

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    // If it looks like a JSON array
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed
            .map((v: any) => {
              if (typeof v === 'string') return v.trim();
              if (v && typeof v === 'object') {
                return (
                  v.label || v.value || v.primaryArtistName || v.name || ''
                );
              }
              return '';
            })
            .filter(Boolean);
        }
      } catch {
        // If parsing fails, treat as comma-separated
        if (value.includes(',')) {
          return value
            .split(',')
            .map(s => s.replace(/[\[\]"]/g, '').trim())
            .filter(Boolean);
        }
      }
    } else if (value.includes(',')) {
      return value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else if (value.trim() !== '') {
      return [value.trim()];
    }
  }

  return [];
};

const isStringArray = (value: any): value is string[] => {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(v => typeof v === 'string' && v.trim().length > 0)
  );
};

const isOptionalStringArray = (value: any): value is string[] => {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value)) return false;
  return value.every(v => typeof v === 'string' && v.trim().length > 0);
};

// ----------------------------------
// CREATE SONG
// ----------------------------------
export const createSong = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const songData = req.body ?? {};

    // ---------- Transform incoming fields ----------
    const transformed: any = {
      ...songData,

      sourceCompany: req.company,
      repertoireOwner: req.company,

      // artists
      primaryArtist: normalizeStringArray(songData.primaryArtist),
      featuringArtists: normalizeStringArray(songData.featuringArtists),

      // text normalization
      description: normalizeDescription(songData.description),
      keywords: toStringArray(songData.keywords),

      // booleans
      isVevo: songData.isVevo === true || songData.isVevo === 'true',
      isCorrection:
        songData.isCorrection === true || songData.isCorrection === 'true',
    };

    const isExistUser = await User.findOne({ channelName: req.company });
    if (!isExistUser) {
      return next(
        createError(
          httpStatus.BAD_REQUEST,
          'Your company is not registered as a user in ANS Music.',
        ),
      );
    }

    // server-side defaults
    const payloadData = {
      ...transformed,
      // videoId is server-owned. Partners were sending their own (UUIDs),
      // which is how non-standard ids ended up in the catalog.
      videoId: await generateUniqueVideoId(),
      videoStatus: 'none',
      isApproved: 'pending',
      isVevo: false,
      isCorrection: false,
      user: isExistUser._id,
    };

    console.log('📦 Creating song with:', {
      primaryArtist: payloadData.primaryArtist,
      featuringArtists: payloadData.featuringArtists,
    });

    const song = new Video(payloadData);
    await song.save();

    res.status(httpStatus.CREATED).json({
      success: true,
      data: song,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return next(
        createError(
          httpStatus.CONFLICT,
          'Song with this ISRC or external ID already exists',
        ),
      );
    }
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

// ----------------------------------
// TRANSFER SONG
// ----------------------------------
export const transferSong = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // @ts-ignore
    const { files } = req;

    // -----------------------------
    // RAW BODY
    // -----------------------------
    const rawSongData = req.body ?? {};

    console.log('📥 Received transfer request with data:', {
      primaryArtist: rawSongData.primaryArtist,
      featuringArtists: rawSongData.featuringArtists,
    });

    // -----------------------------
    // FIXED: Parse JSON string arrays properly
    // -----------------------------
    const songData = {
      ...rawSongData,
      primaryArtist: normalizeStringArray(rawSongData.primaryArtist),
      featuringArtists: normalizeStringArray(rawSongData.featuringArtists),
    };

    console.log('🔄 After normalization:', {
      primaryArtist: songData.primaryArtist,
      featuringArtists: songData.featuringArtists,
    });

    if (songData.isrc) {
      const isExistSong = await Video.findOne({ isrc: songData?.isrc });
      if (isExistSong) {
        throw new ApiError(400, 'Song Already Exists');
      }
    }

    // -----------------------------
    // STRICT VALIDATION
    // -----------------------------
    if (!isStringArray(songData.primaryArtist)) {
      return next(
        createError(
          httpStatus.BAD_REQUEST,
          'primaryArtist must be a non-empty array of strings',
        ),
      );
    }

    if (!isOptionalStringArray(songData.featuringArtists)) {
      return next(
        createError(
          httpStatus.BAD_REQUEST,
          'featuringArtists must be an array of strings if provided',
        ),
      );
    }

    // -----------------------------
    // FILES
    // -----------------------------
    const videoFile = files?.video?.[0]?.location;
    const imageFile = files?.thumbnail?.[0]?.location;

    // -----------------------------
    // TRANSFORM DATA
    // -----------------------------
    const transformed: any = {
      ...songData,

      repertoireOwner: req.company,

      // These are already properly normalized arrays
      primaryArtist: songData.primaryArtist,
      featuringArtists: songData.featuringArtists ?? [],

      description: normalizeDescription(songData.description),
      keywords: toStringArray(songData.keywords),

      isVevo: songData.isVevo === true || songData.isVevo === 'true',
      isCorrection:
        songData.isCorrection === true || songData.isCorrection === 'true',
    };

    // -----------------------------
    // COMPANY CHECK
    // -----------------------------
    const isExistUser = await User.findOne({ channelName: req.company });
    if (!isExistUser) {
      return next(
        createError(
          httpStatus.BAD_REQUEST,
          'Your company is not registered as a user in ANS Music.',
        ),
      );
    }

    // -----------------------------
    // FINAL PAYLOAD
    // -----------------------------
    const payloadData = {
      ...transformed,
      // videoId is server-owned — see note in createSong above.
      videoId: await generateUniqueVideoId(),
      video: videoFile,
      image: imageFile,
      videoStatus: 'none',
      isApproved: 'pending',
      isVevo: false,
      isCorrection: false,
      user: isExistUser._id,
    };

    console.log('📦 Final payload being saved:', {
      primaryArtist: payloadData.primaryArtist,
      featuringArtists: payloadData.featuringArtists,
    });

    const song = new Video(payloadData);
    await song.save();

    res.status(httpStatus.CREATED).json({
      success: true,
      data: song,
    });
  } catch (err: any) {
    console.error('❌ Error in transferSong:', err);

    if (err?.code === 11000) {
      return next(
        createError(
          httpStatus.CONFLICT,
          'Song with this ISRC or external ID already exists',
        ),
      );
    }
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

// ----------------------------------
// UPDATE SONG
// ----------------------------------
export const updateSong = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Normalize artist fields in update data
    if (updateData.primaryArtist) {
      updateData.primaryArtist = normalizeStringArray(updateData.primaryArtist);
    }
    if (updateData.featuringArtists) {
      updateData.featuringArtists = normalizeStringArray(
        updateData.featuringArtists,
      );
    }
    if (updateData.keywords) {
      updateData.keywords = toStringArray(updateData.keywords);
    }
    if (updateData.description) {
      updateData.description = normalizeDescription(updateData.description);
    }

    const song = await B2BSongs.findOneAndUpdate(
      { _id: id, sourceCompany: req.company },
      updateData,
      { new: true, runValidators: true },
    );

    if (!song) {
      return next(
        createError(
          httpStatus.NOT_FOUND,
          'Song not found or you are not authorized to update it',
        ),
      );
    }

    res.status(httpStatus.OK).json({
      success: true,
      data: song,
    });
  } catch (err: any) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};
