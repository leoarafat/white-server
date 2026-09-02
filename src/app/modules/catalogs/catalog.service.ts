/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';
import { Album } from '../album/album.model';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import Admin from '../admin/admin.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { CorrectionContent, ICorrection } from './correction.model';
import sendEmail from '../../../utils/sendEmail';
import User from '../user/user.model';
import { correctionEmailBody } from './Correction.emai';
import {
  getFileMetadata,
  uploadMetadataAndFiles,
  verifyAndSubmitAlbum,
} from '../../../utils/authenticate';
import {
  generateExternalId,
  generateTransactionId,
} from '../../../utils/uniqueId';
import { buildMetadata } from './catalogs.utils';
import mongoose, { Types } from 'mongoose';
import { PrimaryArtist } from '../primary-artist/primary-artist.model';
import {
  concatCopyright,
  mapContributorsToLegacyFields,
} from '../single-track/contributor.utils';

// Applies the copyright-year+text -> single-string concat, and derives the
// legacy flat contributor fields (author/composer/etc.) from the new
// role-based `contributors[]` array — shared by both the user-resubmission
// (editMusic) and admin (editMusicForAdmin) update paths below.
function enrichSingleTrackUpdate(updateData: Record<string, any>) {
  if (updateData.copyrightPYear || updateData.copyrightPText) {
    updateData.pLine =
      concatCopyright(updateData.copyrightPYear, updateData.copyrightPText) ||
      updateData.pLine;
  }
  if (updateData.copyrightCYear || updateData.copyrightCText) {
    updateData.cLine =
      concatCopyright(updateData.copyrightCYear, updateData.copyrightCText) ||
      updateData.cLine;
  }
  if (Array.isArray(updateData.contributors)) {
    Object.assign(updateData, mapContributorsToLegacyFields(updateData.contributors));
  }
  return updateData;
}

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
  const singleSongs = new QueryBuilder(
    SingleTrack.find({
      $and: [
        { isApproved: 'approved' },
        { songStatus: 'none' },
        { isCorrection: false },
      ],
    })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')

      .lean(),
    query,
  )
    .search(
      [
        'releaseTitle',
        'title',
        'subtitle',
        'pLine',
        'cLine',
        'composer',
        'isrc',
        'upc',
      ],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;
  const meta = await singleSongs.countTotal();

  return {
    meta,
    data: singleTracks,
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
  const singleSongs = new QueryBuilder(
    SingleTrack.find({
      $and: [
        { isApproved: 'pending' },
        { isCorrection: false },
        { songStatus: 'none' },
        // A sub-user's upload must not reach the admin queue until their
        // master has approved it (Phase 2 of the sub-user permission
        // system) — masterApprovalStatus defaults to 'approved' for every
        // release NOT uploaded by a sub-user, so this only ever excludes
        // sub-user uploads still awaiting their master's own review.
        { masterApprovalStatus: { $ne: 'pending' } },
      ],
    })

      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      [
        'releaseTitle',
        'title',
        'subtitle',
        'pLine',
        'cLine',
        'composer',
        'isrc',
        'upc',
      ],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;
  const meta = await singleSongs.countTotal();
  return {
    meta,
    data: singleTracks,
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
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ isCorrection: true })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .lean(),
    query,
  )
    .search(
      [
        'releaseTitle',
        'title',
        'subtitle',
        'pLine',
        'cLine',
        'composer',
        'isrc',
        'upc',
      ],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;
  const meta = await singleSongs.countTotal();
  return {
    meta,
    data: singleTracks,
  };
};
//!
const takeDownSongs = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ songStatus: 'take-down' })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .lean(),
    query,
  )
    .search([
      'releaseTitle',
      'title',
      'subtitle',
      'pLine',
      'cLine',
      'composer',
      'isrc',
      'upc',
    ])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;
  const meta = await singleSongs.countTotal();
  return {
    meta,
    data: singleTracks,
  };
};
//!
const inReviewSongs = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ isApproved: 'in_review' })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .lean(),
    query,
  )
    .search([
      'releaseTitle',
      'title',
      'subtitle',
      'pLine',
      'cLine',
      'composer',
      'isrc',
      'upc',
    ])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;
  const meta = await singleSongs.countTotal();
  return {
    meta,
    data: singleTracks,
  };
};
//!
// Mirrors catalog-video.service.ts moveToInReview — flags a pending release
// for a closer look without approving or rejecting it outright.
const moveToInReview = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Move To Review');
  }
  const singleTrack = await SingleTrack.findById(id);
  if (!singleTrack) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }
  return await SingleTrack.findOneAndUpdate(
    { _id: id },
    { isApproved: 'in_review' },
    { new: true },
  );
};
//!
// Admin-scoped delete — the existing SingleMusicService.deleteSingleMusic
// (single-track/single.service.ts) is only reachable by the uploading USER,
// not by admins, so the catalog tables need their own delete path.
const deleteSong = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Delete');
  }
  const singleTrack = await SingleTrack.findById(id);
  if (!singleTrack) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }
  return await SingleTrack.findByIdAndDelete(id);
};
//!
const songInspection = async (id: string) => {
  const song = await SingleTrack.findById(id)

    .populate('user')
    .populate('label')
    .populate('primaryArtist')
    .lean();
  if (song) {
    return song;
  }
  const album = await Album.findById(id)
    .populate('user')
    .populate('label')
    .populate('primaryArtist')
    .lean();
  if (album) {
    return album;
  }
};
//!
// const distributeMusic = async (req: Request) => {
//   const { id } = req.params;
//   const admin = await Admin.findById(req.user?.userId);
//   if (!admin) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
//   }
//   const singleTrack = await SingleTrack.findById(id);
//   const album = await Album.findById(id);
//   const video = await Video.findById(id);
//   if (singleTrack) {
//     return await SingleTrack.findOneAndUpdate(
//       { _id: id },
//       { isApproved: 'approved', isCorrection: false, songStatus: 'none' },
//       { new: true },
//     );
//   }
//   if (album) {
//     return await Album.findOneAndUpdate(
//       { _id: id },
//       { isApproved: 'approved', isCorrection: false, songStatus: 'none' },
//       { new: true },
//     );
//   }
//   if (video) {
//     return await Video.findOneAndUpdate(
//       { _id: id },
//       { isApproved: 'approved', isCorrection: false, videoStatus: 'none' },
//       { new: true },
//     );
//   }
// };
//!
const distributeMusicWithoutPDL = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }
  const singleTrack = await SingleTrack.findById(id);

  if (singleTrack) {
    return await SingleTrack.findOneAndUpdate(
      { _id: id },
      { isApproved: 'approved', isCorrection: false, songStatus: 'none' },
      { new: true },
    );
  }
};

//!
const distributeMusic = async (req: Request) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const admin = await Admin.findById(req.user?.userId).session(session);
    if (!admin) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
    }

    const singleTrack = await SingleTrack.findById(id)
      .populate({
        path: 'label',
        select: 'labelName',
      })
      .populate({
        path: 'primaryArtist',
        select:
          'primaryArtistName primaryArtistAppleId primaryArtistFacebookId primaryArtistSpotifyId primaryArtistInstagramId',
      })
      .session(session);

    //@ts-ignore
    let featureArtists = [];
    if (
      singleTrack?.featuringArtists &&
      singleTrack.featuringArtists.length > 0 &&
      singleTrack.featuringArtists[0] !== ''
    ) {
      featureArtists = await PrimaryArtist.find({
        _id: { $in: singleTrack.featuringArtists },
      });
    }
    if (!singleTrack) {
      throw new ApiError(404, 'Song not found');
    }

    await session.commitTransaction();
    session.endSession();

    const [audioMetadata, coverArtMetadata] = await Promise.all([
      getFileMetadata(singleTrack.audio),
      getFileMetadata(singleTrack.image),
    ]);

    const uniqueId = generateTransactionId();
    const uniquesId = generateExternalId();
    const metadata = buildMetadata(
      singleTrack,
      uniqueId,
      uniquesId,
      audioMetadata,
      coverArtMetadata,
      //@ts-ignore
      featureArtists,
    );

    try {
      const token = await uploadMetadataAndFiles(metadata, singleTrack);
      const result = await verifyAndSubmitAlbum(token, singleTrack);

      if (result && result.success === true) {
        await SingleTrack.findOneAndUpdate(
          { _id: id },
          { isApproved: 'approved', isCorrection: false, songStatus: 'none' },
        );
      }

      return { message: 'Track distributed successfully!' };
    } catch (error: any) {
      throw new Error('Failed to distribute the track: ' + error.message);
    }
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw new Error('Transaction failed: ' + error.message);
  }
};
//!
const editMusic = async (req: Request) => {
  const { id } = req.params;
  const { primaryArtist, ...updateData } = req.body;
  if (
    primaryArtist &&
    primaryArtist[0]?.label &&
    Array.isArray(primaryArtist)
  ) {
    updateData.primaryArtist = primaryArtist
      .map((artist: { value: string }) => artist.value)
      .filter((artistId: string | undefined) => artistId !== undefined);
  } else if (
    primaryArtist &&
    primaryArtist[0]?._id &&
    Array.isArray(primaryArtist)
  ) {
    updateData.primaryArtist = primaryArtist
      .map((artist: { _id: string }) => artist._id)
      .filter((artistId: string | undefined) => artistId !== undefined);
  } else if (Array.isArray(primaryArtist)) {
    // The upload stepper (now reused for editing) sends plain artist name
    // strings — same shape the video flow already stores.
    updateData.primaryArtist = primaryArtist.filter(
      (v: unknown) => typeof v === 'string' && v.trim(),
    );
  }

  const singleTrack = await SingleTrack.findById(id);
  const album = await Album.findById(id);
  const video = await Video.findById(id);
  const target = singleTrack || album || video;
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }

  // Ownership check: USER/SUB_USER callers may only resubmit their OWN
  // release — previously anyone with a valid user/sub-user session could
  // edit/resubmit ANY release by id. Admin callers are untouched (they may
  // legitimately edit any release here).
  //@ts-ignore
  const callerRole = req.user?.role as string;
  if (callerRole === 'user' || callerRole === 'sub-user') {
    //@ts-ignore
    const callerId = req.user?.userId?.toString();
    if (String((target as any).user) !== callerId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You cannot edit this release');
    }
  }

  if (singleTrack) {
    // A release a MASTER rejected only ever reaches this endpoint via a
    // sub-user's resubmission — put it back in front of the master rather
    // than letting it slip straight into the admin pipeline. A master's own
    // upload has masterApprovalStatus 'approved' by default and is
    // untouched (never regressed back to 'pending').
    const resubmittingAfterMasterRejection =
      singleTrack.masterApprovalStatus === 'rejected';
    enrichSingleTrackUpdate(updateData);
    return await SingleTrack.findOneAndUpdate(
      { _id: id },
      {
        ...updateData,
        isApproved: 'pending',
        isCorrection: false,
        songStatus: 'none',
        ...(resubmittingAfterMasterRejection
          ? { masterApprovalStatus: 'pending' }
          : {}),
      },
      {
        new: true,
      },
    );
  }
  if (album) {
    return await Album.findOneAndUpdate(
      { _id: id },
      { isApproved: 'pending', isCorrection: false, ...updateData },
      {
        new: true,
      },
    );
  }
  if (video) {
    const resubmittingAfterMasterRejection =
      video.masterApprovalStatus === 'rejected';
    return await Video.findOneAndUpdate(
      { _id: id },
      {
        isApproved: 'pending',
        isCorrection: false,
        ...updateData,
        ...(resubmittingAfterMasterRejection
          ? { masterApprovalStatus: 'pending' }
          : {}),
      },
      {
        new: true,
      },
    );
  }
};
const editMusicForAdmin = async (req: Request) => {
  const { id } = req.params;
  const { primaryArtist, ...updateData } = req.body;

  if (
    primaryArtist &&
    primaryArtist[0]?.label &&
    Array.isArray(primaryArtist)
  ) {
    updateData.primaryArtist = primaryArtist
      .map((artist: { value: string }) => artist.value)
      .filter((artistId: string | undefined) => artistId !== undefined);
  }
  if (primaryArtist && primaryArtist[0]?._id && Array.isArray(primaryArtist)) {
    updateData.primaryArtist = primaryArtist
      .map((artist: { _id: string }) => artist._id)
      .filter((artistId: string | undefined) => artistId !== undefined);
  }

  const singleTrack = await SingleTrack.findById(id);

  if (singleTrack) {
    enrichSingleTrackUpdate(updateData);
    return await SingleTrack.findOneAndUpdate(
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
const makeTakeDown = async (req: Request) => {
  const { id } = req.params;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }
  const singleTrack = await SingleTrack.findById(id);
  const album = await Album.findById(id);
  const video = await Video.findById(id);
  if (singleTrack) {
    return await SingleTrack.findOneAndUpdate(
      { _id: id },
      { songStatus: 'take-down', isApproved: 'pending', isCorrection: false },
      { new: true },
    );
  }
  if (album) {
    return await Album.findOneAndUpdate(
      { _id: id },
      { songStatus: 'take-down' },
      { new: true },
    );
  }
  if (video) {
    return await Video.findOneAndUpdate(
      { _id: id },
      { videoStatus: 'take-down' },
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
  const singleTrack = await SingleTrack.findById(id);
  const album = await Album.findById(id);
  const video = await Video.findById(id);
  if (singleTrack) {
    return await SingleTrack.findOneAndUpdate(
      { _id: id },
      { songStatus: 'none' },
      { new: true },
    );
  }
  if (album) {
    return await Album.findOneAndUpdate(
      { _id: id },
      { songStatus: 'none' },
      { new: true },
    );
  }
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
  const { user, title, message } = req.body as ICorrection;
  const admin = await Admin.findById(req.user?.userId);
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only Admin Can Distribute');
  }
  const isExistUser = await User.findById(user);
  if (!isExistUser) {
    throw new ApiError(404, 'User not found');
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
      const result = await CorrectionContent.create({
        contentId: id,
        user,
        title,
        message,
      });
      if (result) {
        try {
          sendEmail({
            email: isExistUser?.email,
            subject: `Action needed on your last release : ${content?.releaseTitle ? content?.releaseTitle : content?.title}`,
            html: correctionEmailBody(isExistUser, content, message),
          });
        } catch (error: any) {
          throw new ApiError(500, `${error.message}`);
        }
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
//!
const correctionData = async (req: Request) => {
  const { id } = req.params;

  return await CorrectionContent.findOne({ contentId: id });
};
export const catalogMusicService = {
  releaseSongs,
  pendingSongs,
  correctionSongs,
  takeDownSongs,
  inReviewSongs,
  moveToInReview,
  deleteSong,
  songInspection,
  distributeMusic,
  editMusic,
  makeTakeDown,
  correctionContent,
  removeTakeDown,
  correctionData,
  editMusicForAdmin,
  distributeMusicWithoutPDL,
};
