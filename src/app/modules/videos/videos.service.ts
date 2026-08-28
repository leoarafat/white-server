/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prefer-const */
import ApiError from '../../../errors/ApiError';
import { generateArtistId } from '../../../utils/uniqueId';
import { generateUniqueVideoId } from '../../../utils/videoId';
import User from '../user/user.model';
import QueryBuilder from '../../../builder/QueryBuilder';
import { CustomRequest } from '../../../interfaces/common';
import { Video } from './videos.model';
import { Request, Response } from 'express';
import { IVideos } from './videos.interface';
import { stripProtectedVideoFields } from './videos.utils';
import { notifyAdminsOfSubmission } from '../notifications/notification.hooks';

//!
const uploadVideo = async (req: CustomRequest) => {
  const { files } = req;
  // The stepper client (VideoStepperForm) and the legacy form use different
  // field names for the same data. Accept both so either can post here.
  let {
    primaryArtist,
    primaryArtists, // stepper name (plural)
    featuringArtists,
    ...rawVideoData
  } = req.body;
  // Never trust client payloads with status/distribution flags (isVevo etc.)
  const videoData = stripProtectedVideoFields(rawVideoData);

  const parseList = (value: unknown): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : value.split(',');
      } catch {
        return value.split(',');
      }
    }
    return [];
  };

  const primaryArtistArray = parseList(primaryArtist ?? primaryArtists);
  const featuringArtistArray = parseList(featuringArtists);

  Object.keys(videoData).forEach(key => {
    if (videoData[key] === '') {
      delete videoData[key];
    }
  });
  const user = req?.user?.userId;
  const isSubUserUpload = req?.user?.role === 'sub-user';
  const checkUser = await User.findById(user);
  if (!checkUser) {
    throw new ApiError(404, 'User not found');
  }

  // Accept either a freshly-uploaded multipart file (legacy flow) OR a URL
  // already uploaded via /video/upload-asset (background upload). The stepper
  // keeps the returned URLs in `videoUrl` / `thumbnailUrl`; the legacy form
  // used `video` / `image`.
  const videoFile =
    files?.video?.[0]?.location || videoData.videoUrl || videoData.video;
  const imageFile =
    files?.image?.[0]?.location || videoData.thumbnailUrl || videoData.image;

  if (!videoFile || !imageFile) {
    throw new ApiError(400, 'Both video and Banner files are required');
  }

  // Normalize stepper field names onto what the Mongoose schema expects.
  // Mongoose runs in strict mode, so unmapped names are silently dropped —
  // which previously left title/owner empty and tripped the required guards.
  const title = videoData.title || videoData.videoTitle;
  // repertoireOwner is required by the schema. Prefer the account's VEVO
  // channel name; if the user has none, fall back to the label the video was
  // uploaded under (never the personal name).
  const repertoireOwner =
    videoData.repertoireOwner ||
    videoData.reportingOwner ||
    (checkUser as any).channelName ||
    videoData.label;
  const version = videoData.version || videoData.videoVersion;

  // Drop the client-only aliases so they don't linger on the document.
  delete videoData.videoUrl;
  delete videoData.thumbnailUrl;
  delete videoData.videoTitle;
  delete videoData.reportingOwner;
  delete videoData.videoVersion;

  // Server owns videoId — overwrite anything the client sent.
  videoData.videoId = await generateUniqueVideoId();

  const result = await Video.create({
    ...videoData,
    title,
    repertoireOwner,
    version,
    primaryArtist: primaryArtistArray,
    featuringArtists: featuringArtistArray,

    user,
    video: videoFile,
    image: imageFile,
    isSubUserUpload,
    // See the matching comment in single.service.ts uploadSingle.
    masterApprovalStatus: isSubUserUpload ? 'pending' : 'approved',
  });

  if (!isSubUserUpload) {
    notifyAdminsOfSubmission({
      entityType: 'video',
      entityId: result._id.toString(),
      entityName: result.title,
    }).catch(() => undefined);
  }

  return result;
};
//!

//!
const updateVideo = async (req: Request): Promise<IVideos | null> => {
  //@ts-ignore
  const { files } = req;
  //@ts-ignore
  const id = req.body.id;

  const isExistVideo = await Video.findById(id);
  if (!isExistVideo) {
    throw new ApiError(404, 'Video not found');
  }

  //@ts-ignore
  if (files && files.video) {
    //@ts-ignore
    isExistVideo.video = `${files.video[0].location}`;
  }

  //@ts-ignore
  if (files && files.image) {
    //@ts-ignore
    isExistVideo.image = `${files.image[0].location}`;
  }

  // Save the document directly — spreading a mongoose document into an
  // update spreads internal props (_doc, $__ ...) instead of the data.
  const result = await isExistVideo.save();
  return result;
};
const myAllVideo = async (id: string, query: Record<string, unknown>) => {
  const videoQuery = new QueryBuilder(
    Video.find({ user: id }).lean().populate('user'),
    // .populate('label')
    // .populate('primaryArtist'),
    query,
  )
    .search(['releaseTitle'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await videoQuery.modelQuery;
  const meta = await videoQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const singleVideo = async (id: string) => {
  const result = await Video.findById(id)
    // .populate('label')
    // .populate('primaryArtist')
    .lean();

  return result;
};

const updateSingleVideo = async (id: string, payload: any) => {
  // Never trust client payloads with status/distribution flags (isVevo etc.)
  const videoData = stripProtectedVideoFields(payload);
  const isExists = await Video.findById(id);

  if (isExists) {
    const result = await Video.findOneAndUpdate({ _id: id }, videoData, {
      new: true,
      runValidators: true,
    })
      .populate('label')
      .populate('primaryArtist');
    return result;
  }
};

const deleteSingleVideo = async (id: string) => {
  const isExists = await Video.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Song not found');
  }
  return await Video.findByIdAndDelete(id);
};

const downloadImage = async (req: Request, res: Response) => {
  const { imageUrl } = req.query as any;

  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.set('Content-Type', contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send('Error fetching the image');
  }
};

// Top video uploaders ranked by number of approved videos.
// `limit` (top 5/10/15/20/30/40 ...) controls how many users are returned.
const topUploaders = async (query: Record<string, unknown>) => {
  const parsedLimit = Number(query.limit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;

  const data = await Video.aggregate([
    {
      $group: {
        _id: '$user',
        totalVideos: { $sum: 1 },
        approvedVideos: {
          $sum: { $cond: [{ $eq: ['$isApproved', 'approved'] }, 1, 0] },
        },
      },
    },
    // Most approved uploads first; break ties by total uploads.
    { $sort: { approvedVideos: -1, totalVideos: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    // Drop entries whose user no longer exists.
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        name: '$user.name',
        email: '$user.email',
        image: '$user.image',
        totalVideos: 1,
        approvedVideos: 1,
      },
    },
  ]);

  return { limit, data };
};

export const VideoService = {
  uploadVideo,
  myAllVideo,
  singleVideo,
  updateSingleVideo,
  deleteSingleVideo,
  downloadImage,
  updateVideo,
  topUploaders,
};
