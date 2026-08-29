export const toPublicChannel = (doc: any) => ({
  id: doc._id,
  channelName: doc.channelName,
  artistName: doc.artistName,
  status: doc.status,
  channelUrl: doc.channelUrl,
  youtubeChannelId: doc.youtubeChannelId,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
