import mongoose from 'mongoose';
import { Album } from '../album/album.model';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import { Label } from '../label/label.model';

export const getUserISRC = async () => {
  const singleTrackISRCs = await SingleTrack.find({}).distinct('isrc');

  const videoISRCs = await Video.find({})
    .distinct('isrc')
    .then(isrcs => isrcs.filter(isrc => isrc.trim() !== ''));

  const userISRCsSet = new Set(
    [...singleTrackISRCs, ...videoISRCs]
      .filter(isrc => !!isrc && isrc.trim() !== '')
      .map(isrc => isrc.trim()),
  );

  const userISRCsArray = [...userISRCsSet];

  return userISRCsArray;
};

export const getUserISRCs = async (userId: any) => {
  const singleTrackISRCs = await SingleTrack.find({ user: userId }).distinct(
    'isrc',
  );

  const albumISRCs = await Album.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$audio' },
    {
      $project: {
        _id: 0,
        isrc: { $trim: { input: '$audio.isrc' } },
      },
    },
    { $match: { isrc: { $ne: '' } } },
    {
      $group: {
        _id: null,
        isrcs: { $addToSet: '$isrc' },
      },
    },
    { $project: { _id: 0, isrcs: 1 } },
  ]);

  const albumISRCsArray = albumISRCs.length > 0 ? albumISRCs[0].isrcs : [];

  const videoISRCs = await Video.find({ user: userId })
    .distinct('isrc')
    .then(isrcs => isrcs.filter(isrc => isrc.trim() !== ''));

  const userISRCsSet = new Set(
    [...singleTrackISRCs, ...albumISRCsArray, ...videoISRCs]
      .filter(isrc => !!isrc && isrc.trim() !== '')
      .map(isrc => isrc.trim()),
  );

  const userISRCsArray = [...userISRCsSet];

  return userISRCsArray;
};
export const getUserLabels = async (userId: any) => {
  // Step 1: Get distinct label IDs from SingleTrack collection
  const singleTrackLabelIds = await SingleTrack.find({ user: userId }).distinct(
    'label',
  );

  // Step 2: Fetch only the 'labelName' fields for SingleTrack labels
  const singleTrackLabels = await Label.find({
    _id: { $in: singleTrackLabelIds },
  }).select('labelName -_id');

  // Step 3: Get distinct label IDs from Video collection
  const videoLabelIds = await Video.find({ user: userId }).distinct('label');

  // Step 4: Fetch only the 'labelName' fields for Video labels
  const videoLabels = await Label.find({
    _id: { $in: videoLabelIds },
  }).select('labelName -_id');

  // Step 5: Combine the labels from both SingleTrack and Video and remove duplicates
  const combinedLabels = [...singleTrackLabels, ...videoLabels];

  // Step 6: Map the result to an array of strings (label names)
  const labelNamesArray = [
    ...new Set(combinedLabels.map(label => label.labelName)),
  ];

  return labelNamesArray;
};
export const getUserVideoLink = async (userId: any) => {
  const videoLinks = await Video.find({ user: userId }).distinct('videoLink');

  const extractYouTubeId = (link: string) => {
    if (!link) return null;

    // youtu.be short link
    if (link.includes('youtu.be/')) {
      return link.split('youtu.be/')[1].split('?')[0];
    }

    // youtube.com/watch?v=
    if (link.includes('youtube.com')) {
      const url = new URL(link);
      return url.searchParams.get('v');
    }

    // already an ID
    return link;
  };

  const videoIds = videoLinks.map(extractYouTubeId).filter(Boolean);

  // remove duplicates
  return [...new Set(videoIds)];
};

export const getUserVideoLabel = async (userId: any) => {
  const videoIds = await Video.find({ user: userId }).distinct('label');

  const labelNamesArray = [...new Set(videoIds)];

  return labelNamesArray;
};
