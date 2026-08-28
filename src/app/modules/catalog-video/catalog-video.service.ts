/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request, Response } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';
import { Album } from '../album/album.model';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import Admin from '../admin/admin.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { CorrectionVideoContent, ICorrection } from './catalog-video.model';
import { getMediaDurationFromS3 } from './utils';
import { generateDdexXml } from './generateVideoXML';
import {
  constructDestinationKey,
  downloadFileAsStream,
  IVideoTransferResult,
  uploadFileToS3Transfer,
} from './transfer-s3';
import { logger } from '../../../shared/logger';
import { uploadXmlToS3 } from './vevo-s3';
import User from '../user/user.model';
import { Types } from 'mongoose';
import { stripProtectedVideoFields } from '../videos/videos.utils';

//!

const transferFile = async (req: Request, res: Response): Promise<void> => {
  const adminId = req.user?.userId;
  const { id: videoId } = req.params;

  try {
    // Check admin authorization
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'Only admin can perform this action',
      );
    }

    // Get video info
    const video = await Video.findById(videoId);
    if (!video?.video) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
    }

    const destinationKey = constructDestinationKey(video.video);
    const videoStream = await downloadFileAsStream(video.video);

    // Stream directly from source to destination
    await uploadFileToS3Transfer(videoStream, destinationKey, 'video/mp4');

    logger.info(`Video transferred successfully: ${destinationKey}`);

    const result: IVideoTransferResult = {
      success: true,
      message: 'Transfer successful',
      transferredKey: destinationKey,
    };

    res.status(httpStatus.OK).json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error('Transfer error:', error.message);
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      logger.error('Unexpected transfer error:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};
//!
const releaseSongs = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const videosQuery = new QueryBuilder(
    Video.find({
      $and: [
        { isApproved: 'approved' },
        { isCorrection: false },
        { videoStatus: 'none' },
      ],
    })

      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      ['title', 'isrc', 'audioIsrc', 'upc', 'repertoireOwner', 'videoLink'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const videos = await videosQuery.modelQuery;

  const meta = await videosQuery.countTotal();
  return {
    meta,
    data: videos,
  };
};
//!
const pendingSongs = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const videosQuery = new QueryBuilder(
    Video.find({
      $and: [
        { isApproved: 'pending' },
        { isCorrection: false },
        { videoStatus: 'none' },
        // See the matching comment in catalogs/catalog.service.ts pendingSongs.
        { masterApprovalStatus: { $ne: 'pending' } },
      ],
    })

      .populate('user')
      // .populate('label')
      // .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      ['title', 'isrc', 'audioIsrc', 'upc', 'repertoireOwner', 'videoLink'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const videos = await videosQuery.modelQuery;
  const meta = await videosQuery.countTotal();
  return {
    meta,
    data: videos,
  };
};
//!
const correctionSongs = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const videosQuery = new QueryBuilder(
    Video.find({ isCorrection: true })

      .populate('user')
      // .populate('label')
      // .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      [
        'title',
        'videoId',
        'isrc',
        'audioIsrc',
        'upc',
        'repertoireOwner',
        'videoLink',
      ],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const videos = await videosQuery.modelQuery;
  const meta = await videosQuery.countTotal();
  return {
    meta,
    data: videos,
  };
};
//!
const takeDownSongs = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const videosQuery = new QueryBuilder(
    Video.find({ videoStatus: 'take-down' })

      .populate('user')
      // .populate('label')
      // .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      [
        'title',
        'videoId',
        'isrc',
        'audioIsrc',
        'upc',
        'repertoireOwner',
        'videoLink',
      ],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const videos = await videosQuery.modelQuery;
  const meta = await videosQuery.countTotal();
  return {
    meta,
    data: videos,
  };
};
//!
const songInspection = async (id: string) => {
  const song = await Video.findById(id)

    .populate('user')
    // .populate('label')
    // .populate('primaryArtist')
    .lean();
  return song;
};
//!
const distributeMusic = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }
  const video = await Video.findById(id);

  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      { isApproved: 'approved', isCorrection: false, videoStatus: 'none' },
      { new: true },
    );
  }
};
//!
const editMusic = async (req: Request) => {
  const adminId = req.user?.userId;
  const { id } = req.params;
  // Never trust client payloads with status/distribution flags (isVevo etc.)
  const updateData = stripProtectedVideoFields(req.body);
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Edit');
  }

  const video = await Video.findById(id);

  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      {
        ...updateData,
      },
      {
        new: true,
      },
    );
  }
};
//!
const manualApprove = async (req: Request) => {
  const { id } = req.params;

  const video = await Video.findById(id);

  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      {
        isApproved: 'approved',
        isCorrection: false,
        videoStatus: 'none',
      },

      {
        new: true,
      },
    );
  }
};
//!
const editVideo = async (req: Request) => {
  const { id } = req.params;
  // Never trust client payloads with status/distribution flags (isVevo etc.)
  const updateData = stripProtectedVideoFields(req.body);

  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
  }

  // Ownership check: USER/SUB_USER callers may only resubmit their OWN
  // video — previously anyone with a valid user/sub-user session could edit
  // ANY video by id. Admin callers are untouched.
  //@ts-ignore
  const callerRole = req.user?.role as string;
  if (callerRole === 'user' || callerRole === 'sub-user') {
    //@ts-ignore
    const callerId = req.user?.userId?.toString();
    if (String(video.user) !== callerId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot edit this video');
    }
  }

  // A video a MASTER rejected only reaches here via the sub-user's
  // resubmission — send it back to the master rather than the admin
  // pipeline. A master's own upload (masterApprovalStatus 'approved' by
  // default) is never regressed back to 'pending'.
  const resubmittingAfterMasterRejection =
    video.masterApprovalStatus === 'rejected';

  return await Video.findOneAndUpdate(
    { _id: id },
    {
      ...updateData,
      isApproved: 'pending',
      isCorrection: false,
      videoStatus: 'none',
      ...(resubmittingAfterMasterRejection
        ? { masterApprovalStatus: 'pending' }
        : {}),
    },

    {
      new: true,
    },
  );
};
//!
const makeTakeDown = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }

  const video = await Video.findById(id);

  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      { videoStatus: 'take-down', isApproved: 'pending', isCorrection: false },
      { new: true },
    );
  }
};
const removeTakeDown = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }

  const video = await Video.findById(id);

  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      { videoStatus: 'none' },
      { new: true },
    );
  }
};

//!
const correctionContent = async (req: Request) => {
  const { id } = req.params;
  const { user, message, title } = req.body as ICorrection;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }

  const contentTypes = ['SingleTrack', 'Album', 'Video'];
  for (const contentType of contentTypes) {
    let contentModel;
    switch (contentType) {
      case 'SingleTrack':
        contentModel = SingleTrack;
        break;
      case 'Album':
        contentModel = Album;
        break;
      case 'Video':
        contentModel = Video;
        break;
      default:
        continue;
    }
    //@ts-expect-error
    const content = await contentModel.findById(id);
    if (content) {
      const result = await CorrectionVideoContent.create({
        contentId: id,
        user,
        message,
        title,
      });
      if (result) {
        //@ts-expect-error
        return await contentModel.findOneAndUpdate(
          { _id: id },
          { isCorrection: true },
          { new: true },
        );
      }
    }
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'Content not found');
};
const correctionData = async (req: Request) => {
  const { id } = req.params;
  return await CorrectionVideoContent.findOne({ contentId: id });
};

//!
// A 'processing' lock older than this is considered dead (server crashed or
// restarted mid-transfer) and can be re-claimed by a new transfer attempt.
const VEVO_TRANSFER_STALE_MS = 2 * 60 * 60 * 1000; // 2 hours

const transferToVevo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const transactionId = `[${id.slice(0, 8)}]`; // Short ID for logging

  // 1. Verify admin permissions
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Admin privileges required');
  }

  // 2. Atomically claim the transfer lock. This prevents two concurrent
  // transfers of the same video (double-click, retry after a gateway
  // timeout, or two admins at once) from corrupting the VEVO package.
  const staleBefore = new Date(Date.now() - VEVO_TRANSFER_STALE_MS);
  const video = await Video.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { vevoTransferStatus: { $ne: 'processing' } },
        { vevoTransferStartedAt: { $lt: staleBefore } },
        { vevoTransferStartedAt: null },
      ],
    },
    {
      vevoTransferStatus: 'processing',
      vevoTransferStartedAt: new Date(),
      vevoTransferError: null,
    },
    { new: true },
  )
    .populate('label')
    .populate('user')
    .populate('primaryArtist');

  if (!video) {
    const exists = await Video.findById(id).select('vevoTransferStatus');
    if (!exists) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Video not found');
    }
    throw new ApiError(
      httpStatus.CONFLICT,
      'A VEVO transfer is already in progress for this video. Please wait for it to finish.',
    );
  }

  try {
    logger.info(`${transactionId} Starting VEVO transfer process`);

    // 3. Validate everything we need BEFORE uploading anything
    const missing: string[] = [];
    if (!video.video) missing.push('video file');
    if (!video.image) missing.push('artwork image');
    if (!video.isrc) missing.push('ISRC');
    if (!video.title) missing.push('title');
    if (missing.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot transfer to VEVO — missing required data: ${missing.join(', ')}`,
      );
    }

    // 4. Ensure duration exists (create if missing)
    if (!video.durationMs) {
      logger.info(`${transactionId} Calculating video duration...`);
      const durationStart = Date.now();

      try {
        video.durationMs = await getMediaDurationFromS3(video.video);
        await video.save();
        logger.info(
          `${transactionId} Duration calculated: ${video.durationMs}ms (${Date.now() - durationStart}ms)`,
        );
      } catch (durationError) {
        logger.error(
          `${transactionId} Duration calculation failed:`,
          durationError,
        );
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Failed to calculate video duration',
        );
      }
    } else {
      logger.info(
        `${transactionId} Using existing duration: ${video.durationMs}ms`,
      );
    }

    // 5. Generate DDEX XML (only after duration is confirmed)
    logger.info(`${transactionId} Starting DDEX XML generation`);
    const xmlStart = Date.now();

    let xmlContent: string;
    try {
      xmlContent = await generateDdexXml(video);
      logger.info(
        `${transactionId} DDEX XML generated (${Date.now() - xmlStart}ms)`,
      );
    } catch (xmlError) {
      logger.error(`${transactionId}:`, xmlError);
      const xmlErrorMessage =
        (xmlError as Error)?.message || String(xmlError);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `DDEX XML generation failed: ${xmlErrorMessage}`,
      );
    }

    // 6. Upload all files to VEVO
    logger.info(`${transactionId} Starting file uploads to VEVO`);
    const uploadStart = Date.now();

    try {
      const currentYear = new Date().getFullYear();
      const folderName = `${video.isrc}_${currentYear}`;

      // Upload all files in parallel and wait for all to complete
      await uploadXmlToS3(
        xmlContent,
        folderName,
        video.isrc,
        video.video,
        video.image,
        video.isrc,
      );

      logger.info(
        `${transactionId} All files uploaded to VEVO (${Date.now() - uploadStart}ms)`,
      );
    } catch (uploadError) {
      logger.error(`${transactionId} File upload failed:`, uploadError);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to upload files to VEVO',
      );
    }

    // 7. Mark as VEVO — isVevo becomes true ONLY here, after every file
    // has been confirmed uploaded to the VEVO bucket.
    logger.info(`${transactionId} Updating video status to VEVO`);
    const updateStart = Date.now();

    try {
      const updatedVideo = await Video.findOneAndUpdate(
        { _id: id },
        {
          isVevo: true,
          vevoTransferStatus: 'completed',
          vevoTransferredAt: new Date(),
          vevoTransferError: null,
          isApproved: 'approved',
          isCorrection: false,
          videoStatus: 'none',
          updatedTime: new Date(),
        },
        { new: true },
      );
      logger.info(
        `${transactionId} VEVO status updated (${Date.now() - updateStart}ms)`,
      );

      // Send success response only after everything is complete
      res.status(httpStatus.OK).json({
        success: true,
        message: 'Video successfully transferred to VEVO',
        data: updatedVideo,
      });
    } catch (updateError) {
      logger.error(`${transactionId} Status update failed:`, updateError);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Video files were uploaded to VEVO but the status update failed — please retry the transfer',
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof ApiError
        ? error.message
        : (error as Error)?.message || 'VEVO transfer process failed';

    logger.error(`${transactionId} Transfer process failed:`, error);

    // Persist the failure on the video so ans-admin can see WHAT failed
    // and WHY, directly from the videoReleaseVideo page. isVevo is left
    // untouched — it only ever becomes true after a fully successful upload.
    try {
      await Video.findByIdAndUpdate(id, {
        vevoTransferStatus: 'failed',
        vevoTransferError: errorMessage,
      });
    } catch (persistError) {
      logger.error(
        `${transactionId} Failed to persist transfer failure state:`,
        persistError,
      );
    }

    // If the error is already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap unexpected errors — include the real reason so the admin UI
    // shows something actionable instead of a generic message
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `VEVO transfer failed: ${errorMessage}`,
    );
  }
};
export const catalogVideoService = {
  releaseSongs,
  pendingSongs,
  correctionSongs,
  takeDownSongs,
  songInspection,
  distributeMusic,
  editMusic,
  makeTakeDown,
  correctionContent,
  removeTakeDown,
  correctionData,
  editVideo,
  transferToVevo,
  transferFile,
  manualApprove,
};
