/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import { SingleTrack } from './single.model';
import ApiError from '../../../errors/ApiError';

import { generateArtistId } from '../../../utils/uniqueId';
import User from '../user/user.model';
import { Album } from '../album/album.model';
import QueryBuilder from '../../../builder/QueryBuilder';
import { SingleDraft } from './single.drafts.model';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { PrimaryArtist } from '../primary-artist/primary-artist.model';
import { Label } from '../label/label.model';
import { notifyAdminsOfSubmission } from '../notifications/notification.hooks';

// Single tracks now store artist/label NAMES (strings), like the video flow.
// The upload form may still send PrimaryArtist/Label ObjectIds, so resolve any
// id to its name; plain-name values pass through unchanged.
const isObjectIdLike = (v: unknown) =>
  typeof v === 'string' && v.length === 24 && Types.ObjectId.isValid(v);

const resolveArtistNames = async (
  value: unknown,
): Promise<string[]> => {
  const arr = Array.isArray(value)
    ? value
    : typeof value === 'string' && value
      ? value.split(',')
      : [];
  const names: string[] = [];
  for (const raw of arr) {
    const v = String(raw).trim();
    if (!v) continue;
    if (isObjectIdLike(v)) {
      const doc = await PrimaryArtist.findById(v).lean();
      names.push((doc as any)?.primaryArtistName || v);
    } else {
      names.push(v);
    }
  }
  return names;
};

const resolveLabelName = async (value: unknown): Promise<string> => {
  const v = value == null ? '' : String(value).trim();
  if (isObjectIdLike(v)) {
    const doc = await Label.findById(v).lean();
    return (doc as any)?.labelName || v;
  }
  return v;
};

const uploadSingle = async (req: Request) => {
  const { files } = req;

  const { primaryArtist, draftId, ...data } = req.body;

  const user = req?.user?.userId;
  const isSubUserUpload = req?.user?.role === 'sub-user';
  // Store artist/label NAMES (strings), resolving any ObjectId the form sends.
  const primaryArtistArray = await resolveArtistNames(primaryArtist);
  data.label = await resolveLabelName(data.label);
  if (data.featuringArtists) {
    data.featuringArtists = await resolveArtistNames(data.featuringArtists);
  }

  const checkUser = await User.findById(user);
  if (!checkUser) {
    throw new ApiError(404, 'User not found');
  }
  if (data?.isrc) {
    const isExistIsrc = await SingleTrack.findOne({ isrc: data?.isrc });
    if (isExistIsrc) {
      throw new ApiError(400, 'ISRC  Is Duplicate');
    }
  }

  if (data.upc) {
    const isExistUpc = await SingleTrack.findOne({ upc: data?.upc });
    if (isExistUpc) {
      throw new ApiError(400, 'UPC Is Duplicate');
    }
  }
  data.releaseId = generateArtistId();
  data.format = 'Album';

  // The single-track upload form doesn't collect these, but the schema marks
  // them required — supply sensible defaults so submission isn't blocked by a
  // Mongoose validation error naming fields that aren't in the form.
  if (!data.secondaryTrackType) data.secondaryTrackType = 'Original';
  if (!data.contentType) data.contentType = 'Single';
  if (!data.price) data.price = '0';

  // Accept either a freshly-uploaded multipart file (legacy flow) OR a URL
  // already uploaded via /single-music/upload-asset (dream-records-style
  // background upload). The client keeps the returned URL in `audio` / `image`.
  //@ts-ignore
  const audioFile = files?.audio
    ? `${files.audio[0].location}`
    : data.audio || undefined;
  //@ts-ignore
  const imageFile = files?.image
    ? `${files.image[0].location}`
    : data.image || undefined;

  if (!audioFile || !imageFile) {
    throw new ApiError(400, 'Both audio and image files are required');
  }

  const result = await SingleTrack.create({
    ...data,
    user,
    audio: audioFile,
    image: imageFile,
    primaryArtist: primaryArtistArray,
    isSubUserUpload,
    // A sub-user's upload waits for their master's approval before the admin
    // pool ever sees it — the admin-submission notification below is
    // deliberately skipped in that case (see master-review.service.ts
    // `approve`, which sends it once the master signs off).
    masterApprovalStatus: isSubUserUpload ? 'pending' : 'approved',
  });

  if (!isSubUserUpload) {
    notifyAdminsOfSubmission({
      entityType: 'single-track',
      entityId: result._id.toString(),
      entityName: result.title,
    }).catch(() => undefined);
  }

  // A finalized draft is no longer a draft — best-effort cleanup, scoped to
  // this user so it can never touch someone else's draft. A failure here
  // must never fail the upload that already succeeded.
  if (draftId) {
    SingleDraft.deleteOne({ _id: draftId, user }).catch(() => undefined);
  }

  return result;
};
const uploadDrafts = async (req: Request) => {
  const { files } = req;

  const { primaryArtist, draftId, ...data } = req.body;

  const user = req?.user?.userId;
  const primaryArtistArray = await resolveArtistNames(primaryArtist);
  if (data.label) data.label = await resolveLabelName(data.label);
  if (data.featuringArtists) {
    data.featuringArtists = await resolveArtistNames(data.featuringArtists);
  }

  const checkUser = await User.findById(user);
  if (!checkUser) {
    throw new ApiError(404, 'User not found');
  }

  let audioFile: string | undefined;
  //@ts-ignore
  if (files?.audio) {
    //@ts-ignore
    audioFile = `${files.audio[0].location}`;
  }

  let imageFile: string | undefined;
  //@ts-ignore
  if (files?.image) {
    //@ts-ignore
    imageFile = `${files.image[0].location}`;
  }

  // A draft bypasses the strict Zod schema on purpose, so unlike final
  // submit, unfilled fields routinely arrive as "". Enum fields (e.g.
  // primaryTrackType, instrumental) reject "" as an invalid value — strip
  // blanks so an in-progress draft never fails Mongoose validation.
  Object.keys(data).forEach(key => {
    if (data[key] === '') delete data[key];
  });

  const payload: Record<string, unknown> = {
    ...data,
    user,
    primaryArtist: primaryArtistArray,
  };
  if (audioFile) payload.audio = audioFile;
  if (imageFile) payload.image = imageFile;

  if (draftId) {
    const existing = await SingleDraft.findOne({ _id: draftId, user });
    if (!existing) {
      throw new ApiError(404, 'Draft not found');
    }
    const result = await SingleDraft.findByIdAndUpdate(draftId, payload, {
      new: true,
      runValidators: true,
    });
    return result;
  }

  payload.releaseId = generateArtistId();

  const result = await SingleDraft.create(payload);

  return result;
};
const deleteDraft = async (id: string, user: any) => {
  const existing = await SingleDraft.findOne({ _id: id, user });
  if (!existing) {
    throw new ApiError(404, 'Draft not found');
  }
  return SingleDraft.findByIdAndDelete(id);
};
const draftsSong = async (user: any, query: Record<string, unknown>) => {
  const songQuery = new QueryBuilder(
    SingleDraft.find({ user: user?.userId })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )
    .search(['releaseTitle'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await songQuery.modelQuery;
  const meta = await songQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const myAllMusic = async (user: JwtPayload, query: Record<string, unknown>) => {
  const { userId } = user;
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ $and: [{ user: userId }, { isApproved: 'approved' }] })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )
    .search(['releaseTitle', 'title', 'subtitle', 'pLine', 'cLine', 'isrc'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;

  return singleTracks;
};

const singleMusic = async (id: string) => {
  const result = await SingleTrack.findById(id)
    .populate('label')
    .populate('primaryArtist')
    .lean();

  if (result) {
    return result;
  }
  const album = await Album.findById(id).lean();
  if (album) {
    return album;
  }
};
const singleDraftsMusic = async (id: string, user: any) => {
  const result = await SingleDraft.findOne({ _id: id, user: user?.userId })
    .populate('label')
    .populate('primaryArtist')
    .lean();

  if (!result) {
    throw new ApiError(404, 'Draft not found');
  }

  return result;
};

const updateSingleMusic = async (id: string, payload: any) => {
  const { ...musicData } = payload;
  const isExists = await SingleTrack.findById(id);
  const album = await Album.findById(id);

  if (isExists) {
    if (payload.primaryArtist) {
      musicData.primaryArtist = await resolveArtistNames(payload.primaryArtist);
    }
    if (payload.label) {
      musicData.label = await resolveLabelName(payload.label);
    }
    if (payload.featuringArtists) {
      musicData.featuringArtists = await resolveArtistNames(
        payload.featuringArtists,
      );
    }
    if (payload.writer) {
      musicData.writer = payload.writer;
    }
    if (payload.composer) {
      musicData.composer = payload.composer;
    }
    if (payload.musicDirector) {
      musicData.musicDirector = payload.musicDirector;
    }
    if (payload.producer) {
      musicData.producer = payload.producer;
    }
    const result = await SingleTrack.findOneAndUpdate({ _id: id }, musicData, {
      new: true,
      runValidators: true,
    })
      .populate('label')
      .populate('primaryArtist');

    return result;
  }

  if (album) {
    if (payload.primaryArtist) {
      musicData.primaryArtist = payload.primaryArtist.map(
        (artistId: { toString: () => any }) => artistId.toString(),
      );
    }
    if (payload.writer) {
      musicData.writer = payload.writer;
    }
    if (payload.composer) {
      musicData.composer = payload.composer;
    }
    if (payload.musicDirector) {
      musicData.musicDirector = payload.musicDirector;
    }
    if (payload.producer) {
      musicData.producer = payload.producer;
    }
    const result = await Album.findOneAndUpdate({ _id: id }, musicData, {
      new: true,
      runValidators: true,
    })
      .populate('label')
      .populate('primaryArtist');
    return result;
  }
};

const deleteSingleMusic = async (id: string) => {
  const isExists = await SingleTrack.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Song not found');
  }
  return await SingleTrack.findByIdAndDelete(id);
};
const updateBannerAndAudio = async (req: Request) => {
  const id = req.params.id;
  const isExist = await SingleTrack.findById(id);

  if (!isExist) {
    throw new ApiError(404, 'Song not found');
  }

  const files = req.files as any;

  if (!files || (!files.image && !files.audio)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is missing');
  }

  const updateData: Partial<typeof isExist> = {};

  if (files.image && files.image[0]) {
    updateData.image = `${files.image[0].location}`;
  }

  if (files.audio && files.audio[0]) {
    updateData.audio = `${files.audio[0].location}`;
  }

  const updatedTrack = await SingleTrack.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return updatedTrack;
};
export const SingleMusicService = {
  uploadSingle,
  myAllMusic,
  singleMusic,
  updateSingleMusic,
  deleteSingleMusic,
  uploadDrafts,
  draftsSong,
  singleDraftsMusic,
  deleteDraft,
  updateBannerAndAudio,
};
