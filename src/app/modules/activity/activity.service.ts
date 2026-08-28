import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import QueryBuilder from '../../../builder/QueryBuilder';

//!
const inspection = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    // masterApprovalStatus exclusion: a sub-user's upload must not surface
    // in any admin-facing list until their master has approved it (Phase 2
    // of the sub-user permission system) — see catalogs/catalog.service.ts
    // pendingSongs for the full explanation.
    SingleTrack.find({ isApproved: 'pending', masterApprovalStatus: { $ne: 'pending' } })
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

  const singleTracks = await singleSongs.modelQuery;

  const albumSong = new QueryBuilder(
    Album.find({ isApproved: 'pending' })
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

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  return combinedData;
};

const failedInspection = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ isApproved: 'rejected' })
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

  const singleTracks = await singleSongs.modelQuery;
  const albumSong = new QueryBuilder(
    Album.find({ isApproved: 'rejected' })
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

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  return combinedData;
};
const processing = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    // masterApprovalStatus exclusion: a sub-user's upload must not surface
    // in any admin-facing list until their master has approved it (Phase 2
    // of the sub-user permission system) — see catalogs/catalog.service.ts
    // pendingSongs for the full explanation.
    SingleTrack.find({ isApproved: 'pending', masterApprovalStatus: { $ne: 'pending' } })
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

  const singleTracks = await singleSongs.modelQuery;
  const albumSong = new QueryBuilder(
    Album.find({ isApproved: 'pending' })
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

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  return combinedData;
};
const distributed = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    SingleTrack.find({ songStatus: 'distribute' })
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

  const singleTracks = await singleSongs.modelQuery;
  const albumSong = new QueryBuilder(
    Album.find({ songStatus: 'distribute' })
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

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  return combinedData;
};
const takeDown = async (query: Record<string, unknown>) => {
  const singleSongs = new QueryBuilder(
    // masterApprovalStatus exclusion: a sub-user's upload must not surface
    // in any admin-facing list until their master has approved it (Phase 2
    // of the sub-user permission system) — see catalogs/catalog.service.ts
    // pendingSongs for the full explanation.
    SingleTrack.find({ isApproved: 'pending', masterApprovalStatus: { $ne: 'pending' } })
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

  const singleTracks = await singleSongs.modelQuery;
  const albumSong = new QueryBuilder(
    Album.find({ isApproved: 'pending' })
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

  const albums = await albumSong.modelQuery;

  const combinedData = [...singleTracks, ...albums];

  return combinedData;
};
const makeTakeDown = async (payload: { songId: string }) => {
  const { songId } = payload;

  const checkSingleSong = await SingleTrack.findById(songId);

  const checkAlbumSong = await Album.findById(songId);

  let updatedSingleTrack;
  let updatedAlbum;

  if (checkSingleSong) {
    updatedSingleTrack = await SingleTrack.findOneAndUpdate(
      { _id: songId },
      { songStatus: 'take-down' },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('label')
      .populate('primaryArtist');
  }

  if (checkAlbumSong) {
    updatedAlbum = await Album.findOneAndUpdate(
      { _id: songId },
      { songStatus: 'take-down' },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('label')
      .populate('primaryArtist');
  }

  return { updatedSingleTrack, updatedAlbum };
};

const makeDistribute = async (payload: { songId: string }) => {
  const { songId } = payload;

  const checkSingleSong = await SingleTrack.findById(songId);

  const checkAlbumSong = await Album.findById(songId);

  let updatedSingleTrack;
  let updatedAlbum;

  if (checkSingleSong) {
    updatedSingleTrack = await SingleTrack.findOneAndUpdate(
      { _id: songId },
      { songStatus: 'distribute' },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('label')
      .populate('PrimaryArtist');
  }

  if (checkAlbumSong) {
    updatedAlbum = await Album.findOneAndUpdate(
      { _id: songId },
      { songStatus: 'distribute' },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate('label')
      .populate('PrimaryArtist');
  }

  return { updatedSingleTrack, updatedAlbum };
};

export const activityService = {
  inspection,
  failedInspection,
  processing,
  distributed,
  takeDown,
  makeTakeDown,
  makeDistribute,
};
