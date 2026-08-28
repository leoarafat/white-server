import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../../builder/QueryBuilder';
import { Album } from '../album/album.model';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import { QueryParams } from './myuploads.interface';
import { IReqUser } from '../../../interfaces/common';

//! Audio Songs
const pendingSongs = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const singleSongsQuery = SingleTrack.find({
    $and: [
      { user: user?.userId },
      { isApproved: 'pending' },
      { songStatus: 'none' },
      { isCorrection: false },
    ],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const singleSongs = new QueryBuilder(singleSongsQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;

  const albumSongQuery = Album.find({
    $and: [{ user: user?.userId }, { isApproved: 'pending' }],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const albumSong = new QueryBuilder(albumSongQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  const totalCountQuery = SingleTrack.find({
    $and: [{ user: user?.userId }, { isApproved: 'pending' }],
  })
    .merge(
      Album.find({ $and: [{ user: user?.userId }, { isApproved: 'pending' }] }),
    )
    .lean();

  const totalResult = new QueryBuilder(totalCountQuery, query)
    .search(['title', 'label'])
    .filter()
    .countTotal();

  const { page, limit, total, totalPage } = await totalResult;

  return {
    data: combinedData,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};
const successReleaseSongs = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const singleSongsQuery = SingleTrack.find({
    $and: [
      { user: user?.userId },
      { isApproved: 'approved' },
      { songStatus: 'none' },
      { isCorrection: false },
    ],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const singleSongs = new QueryBuilder(singleSongsQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;

  const albumSongQuery = Album.find({
    $and: [
      { user: user?.userId },
      { isApproved: 'approved' },
      { isCorrection: false },
    ],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const albumSong = new QueryBuilder(albumSongQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  const totalCountQuery = SingleTrack.find({
    $and: [{ user: user?.userId }, { isApproved: 'approved' }],
  })
    .merge(
      Album.find({
        $and: [{ user: user?.userId }, { isApproved: 'approved' }],
      }),
    )
    .lean();

  const totalResult = new QueryBuilder(totalCountQuery, query)
    .search(['title', 'label'])
    .filter()
    .countTotal();

  const { page, limit, total, totalPage } = await totalResult;

  return {
    data: combinedData,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};
const correctionSongs = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const singleSongsQuery = SingleTrack.find({
    $and: [
      { user: user?.userId },
      { isCorrection: true },
      { songStatus: 'none' },
      // { isApproved: 'pending' },
    ],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const singleSongs = new QueryBuilder(singleSongsQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;

  const albumSongQuery = Album.find({
    $and: [{ user: user?.userId }, { isCorrection: true }],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const albumSong = new QueryBuilder(albumSongQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  const totalCountQuery = SingleTrack.find({
    $and: [{ user: user?.userId }, { isCorrection: true }],
  })
    .merge(
      Album.find({ $and: [{ user: user?.userId }, { isCorrection: true }] }),
    )
    .lean();

  const totalResult = new QueryBuilder(totalCountQuery, query)
    .search(['title', 'label'])
    .filter()
    .countTotal();

  const { page, limit, total, totalPage } = await totalResult;

  return {
    data: combinedData,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

const takeDownSongs = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const singleSongsQuery = SingleTrack.find({
    $and: [{ user: user?.userId }, { songStatus: 'take-down' }],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const singleSongs = new QueryBuilder(singleSongsQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const singleTracks = await singleSongs.modelQuery;

  const albumSongQuery = Album.find({
    $and: [{ user: user?.userId }, { songStatus: 'take-down' }],
  })
    .lean()
    .populate('user')
    .populate('label')
    .populate('primaryArtist');

  const albumSong = new QueryBuilder(albumSongQuery, query)
    .search(['title', 'label'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  const totalCountQuery = SingleTrack.find({
    $and: [{ user: user?.userId }, { songStatus: 'take-down' }],
  })
    .merge(
      Album.find({
        $and: [{ user: user?.userId }, { songStatus: 'take-down' }],
      }),
    )
    .lean();

  const totalResult = new QueryBuilder(totalCountQuery, query)
    .search(['title', 'label'])
    .filter()
    .countTotal();

  const { page, limit, total, totalPage } = await totalResult;

  return {
    data: combinedData,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

//! Videos
const pendingVideos = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const videoQuery = new QueryBuilder(
    Video.find({
      $and: [
        { user: user?.userId },
        { isApproved: 'pending' },
        { videoStatus: 'none' },
        { isCorrection: false },
      ],
    })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )

    .search(['title', 'label'])
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
const successReleaseVideos = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const videoQuery = new QueryBuilder(
    Video.find({
      $and: [
        { user: user?.userId },
        { isApproved: 'approved' },
        { isCorrection: false },
      ],
    })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )
    .search(['title', 'label'])
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
const correctionVideos = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const videoQuery = new QueryBuilder(
    Video.find({
      $and: [
        { user: user?.userId },
        { isCorrection: true },
        // { isApproved: 'pending' },
      ],
    })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )
    .search(['title', 'label'])
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

const takeDownVideos = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const videoQuery = new QueryBuilder(
    Video.find({
      $and: [{ user: user?.userId }, { videoStatus: 'take-down' }],
    })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist'),
    query,
  )
    .search(['title', 'label'])
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

const allSongs = async (user: JwtPayload, query: QueryParams) => {
  const page = parseInt(query.page as unknown as string, 10) || 1;
  const limit = parseInt(query.limit as unknown as string, 10) || 10;
  const search = (query.searchTerm as string) || '';

  const skip = (page - 1) * limit;

  const searchFilter = search
    ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { releaseTitle: { $regex: search, $options: 'i' } },
          { isrc: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const userFilter = { user: user?.userId };

  const singleTrackFilter = { ...userFilter, ...searchFilter };
  const videoFilter = { ...userFilter, ...searchFilter };

  const [singleSongs, videos, totalSingles, totalVideos] = await Promise.all([
    SingleTrack.find(singleTrackFilter)
      .sort({ createdAt: -1 })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .skip(skip)
      .limit(limit)
      .exec(),

    Video.find(videoFilter)
      .sort({ createdAt: -1 })
      .lean()
      .populate('user')
      .populate('label')
      .populate('primaryArtist')
      .skip(skip)
      .limit(limit)
      .exec(),

    SingleTrack.countDocuments(singleTrackFilter).exec(),
    Video.countDocuments(videoFilter).exec(),
  ]);

  const totalPagesSingles = Math.ceil(totalSingles / limit);
  const totalPagesVideos = Math.ceil(totalVideos / limit);

  return {
    pagination: {
      currentPage: page,
      limit,
      totalSingles,
      totalVideos,
      totalPagesSingles,
      totalPagesVideos,
    },
    singleSongs,
    videos,
  };
};

//! Export
const exportAudioSongs = async (user: IReqUser) => {
  if (user.role === 'user' || user.role === 'sub-user') {
    const res = await SingleTrack.find({ user: user.userId })
      .populate('label')
      .populate('primaryArtist');
    return res;
  } else {
    const res = await SingleTrack.find({ isApproved: 'approved' })
      .populate('label')
      .populate('primaryArtist');
    return res;
  }
};
const exportVideoSongs = async (user: IReqUser) => {
  if (user.role === 'user' || user.role === 'sub-user') {
    const res = await Video.find({ user: user.userId })
      .populate('label')
      .populate('primaryArtist');
    return res;
  } else {
    const res = await Video.find({ isApproved: 'approved' });

    return res;
  }
};
const exportPendingAudioSongs = async (user: IReqUser) => {
  if (user.role === 'user' || user.role === 'sub-user') {
    const res = await SingleTrack.find({ user: user.userId })
      .populate('label')
      .populate('primaryArtist');
    return res;
  } else {
    const res = await SingleTrack.find({ isApproved: 'pending' })
      .populate('label')
      .populate('primaryArtist');
    return res;
  }
};
const exportPendingVideoSongs = async (user: IReqUser) => {
  if (user.role === 'user' || user.role === 'sub-user') {
    const res = await Video.find({ user: user.userId })
      .populate('label')
      .populate('primaryArtist');
    return res;
  } else {
    const res = await Video.find({ isApproved: 'pending' });

    return res;
  }
};
export const MyUploadService = {
  pendingSongs,
  successReleaseSongs,
  correctionSongs,
  takeDownSongs,
  pendingVideos,
  successReleaseVideos,
  correctionVideos,
  takeDownVideos,
  allSongs,
  exportAudioSongs,
  exportVideoSongs,
  exportPendingAudioSongs,
  exportPendingVideoSongs,
};
