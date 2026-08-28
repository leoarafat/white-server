import { Album } from './album.model';
import ApiError from '../../../errors/ApiError';
import { CustomRequest } from '../../../interfaces/common';
import { generateArtistId } from '../../../utils/uniqueId';
import mongoose from 'mongoose';
import { notifyAdminsOfSubmission } from '../notifications/notification.hooks';

const uploadAlbum = async (req: CustomRequest) => {
  const { audio: audioData, primaryArtist, ...othersData } = req.body;
  const { image, audio: audioFiles } = req.files as any;

  if (!Array.isArray(audioFiles)) {
    throw new Error('Audio files must be provided in an array.');
  }

  const formattedAudio = audioFiles.map((audioFile: any, index: number) => ({
    audioFileName: `${audioFile.location}`,
    releaseTitle: audioData[index].title,
    subtitle: audioData[index].subtitle || 'undefined',
    primaryArtist: audioData[index].primaryArtists.split(','),
    format: audioData[index].format,
    label: audioData[index].label,
    writer: audioData[index].writers.split(','),
    composer: audioData[index].composers.split(','),
    // musicDirectors: [],
    producers: audioData[index].producers.split(','),
    featuring: audioData[index].featuringArtists.split(','),
    genre: audioData[index].genre,
    subGenre: audioData[index].subGenre || 'undefined',
    // upcEan: audioData[index].upcEan || 'undefined',
    originalReleaseDate: audioData[index].originalReleaseDate || 'undefined',
    // lyricsLanguage: audioData[index].language || 'undefined',
    productionYear: audioData[index].productionYear,
    youtube: audioData[index].youtube || 'undefined',
    lyrics: audioData[index].lyrics,
    isrc: audioData[index].isrc,
  }));

  const newAlbum = {
    ...othersData,
    audio: formattedAudio,
    image: `${image[0].location}`,
    primaryArtist: primaryArtist
      ?.split(',')
      .map((id: string) => new mongoose.Types.ObjectId(id.trim())),
    user: req.user.userId,
    songType: 'album',
    releaseId: generateArtistId(),
  };

  const result = await Album.create(newAlbum);

  notifyAdminsOfSubmission({
    entityType: 'album',
    entityId: result._id.toString(),
    entityName: result.releaseTitle,
  }).catch(() => undefined);

  return result;
};

const myAllAlbum = async (id: string) => {
  const result = await Album.find({ user: id })
    .populate('Label')
    .populate('PrimaryArtist')
    .lean();

  return result;
};
const SingleAlbum = async (id: string) => {
  const result = await Album.findById(id)
    .populate('Label')
    .populate('PrimaryArtist')
    .lean();
  return result;
};
const updateAlbum = async (id: string, payload: any) => {
  const { ...musicData } = payload;
  const isExists = await Album.findById(id)
    .populate('Label')
    .populate('PrimaryArtist');
  if (!isExists) {
    throw new ApiError(404, 'Song not found');
  }
  const result = await Album.findOneAndUpdate({ _id: id }, musicData, {
    new: true,
    runValidators: true,
  })
    .populate('Label')
    .populate('PrimaryArtist');
  return result;
};
const deleteAlbum = async (id: string) => {
  const isExists = await Album.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Song not found');
  }
  return await Album.findByIdAndDelete(id);
};

export const AlbumService = {
  uploadAlbum,
  myAllAlbum,
  SingleAlbum,
  updateAlbum,
  deleteAlbum,
};
