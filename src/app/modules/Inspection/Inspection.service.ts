import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import User from '../user/user.model';
import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import { Request } from 'express';
import { Video } from '../videos/videos.model';
import { IReqUser } from '../../../interfaces/common';

//!
const userInspection = async (id: string) => {
  const user = await User.findById(id).lean();
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find both single tracks and albums for the user
  const singleTracks = await SingleTrack.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();

  const albums = await Album.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();

  // Fetch latest single tracks and albums for the user
  const latestSingleTrack = await SingleTrack.find({ user: id })
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();
  const latestAlbum = await Album.find({ user: id })
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();

  // Combine single tracks and albums for total releases and all songs
  const totalReleases = singleTracks.length + albums.length;
  const allSongs = [...singleTracks, ...albums];

  return {
    userInfo: user,
    totalReleases,
    latestRelease: [...latestSingleTrack, ...latestAlbum],
    allSong: allSongs,
  };
};

const songInspection = async (id: string) => {
  const song = await SingleTrack.findById(id)
    .populate('label')
    .populate('primaryArtist')
    .lean();
  if (song) {
    return song;
  }
  const album = await Album.findById(id)
    .populate('label')
    .populate('primaryArtist')
    .lean();
  if (album) {
    return album;
  }
};

//!
const userTotalSong = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const singleTracks = await SingleTrack.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();
  const albums = await Album.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();

  const totalSongs = [...singleTracks, ...albums];

  return totalSongs;
};

//!
const singleSongs = async (id: string) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find both single tracks and albums for the user
  const singleTracks = await SingleTrack.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();
  const albums = await Album.find({ user: id })
    .populate('label')
    .populate('primaryArtist')
    .lean();

  const totalSongs = [...singleTracks, ...albums];

  return totalSongs;
};
const latestSongs = async (req: Request) => {
  const { userId } = req.user as IReqUser;
  const latestSingleTrack = await SingleTrack.find({ user: userId })
    .populate('label')
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();
  const latestVideo = await Video.find({ user: userId })
    .populate('label')
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();
  return { latestSingleTrack, latestVideo };
};
export const inspectionService = {
  userInspection,
  songInspection,
  userTotalSong,
  singleSongs,
  latestSongs,
};
