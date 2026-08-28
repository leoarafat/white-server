import { Request } from 'express';
import { IStoredSongs } from './sotred-songs.interface';
import { StoredSongs } from './sotred-songs.model';
import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import { Video } from '../videos/videos.model';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

const addSongInStore = async (req: Request) => {
  const dataArray = req.body as IStoredSongs[];

  const results = [];

  for (const data of dataArray) {
    const existingRecord = await StoredSongs.findOne({
      storeId: data.storeId,
      contentId: data.contentId,
    });

    if (existingRecord) {
      existingRecord.contentType = data.contentType;
      existingRecord.storeStatus = data.storeStatus;
      await existingRecord.save();
      results.push(existingRecord);
    } else {
      const newRecord = await StoredSongs.create(data);
      results.push(newRecord);
    }
  }

  return results;
};

const getStoreBySong = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid contentId: ${id}`);
  }

  const objectId = new mongoose.Types.ObjectId(id);

  const storedSong = await StoredSongs.findOne({ contentId: objectId });
  if (!storedSong) {
    // No record found
    // throw new ApiError(
    //   httpStatus.NOT_FOUND,
    //   `No StoredSong found for contentId=${id}`,
    // );
    return;
  }
  let contentModel;
  switch (storedSong && storedSong.contentType) {
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
      throw new ApiError(
        httpStatus.UNSUPPORTED_MEDIA_TYPE,
        `Unsupported contentType: ${storedSong && storedSong.contentType}`,
      );
  }

  return await StoredSongs.find({ contentId: objectId })
    .populate({
      path: 'contentId',
      model: contentModel,
    })
    .populate('storeId');
};

const updateStoreForSong = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  return await StoredSongs.findByIdAndUpdate(
    id,
    { ...data },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const StoreService = {
  addSongInStore,
  getStoreBySong,
  updateStoreForSong,
};
