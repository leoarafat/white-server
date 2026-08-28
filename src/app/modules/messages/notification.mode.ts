import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: String, // e.g., channel-publish
    videoId: String, // if present in payload
    isrc: String, // e.g., QZTAV2341939
    channelId: String, // from channel_id
    operation: String, // e.g., insert
    stage: String, // e.g., post
    externalId: String, // from external_id
    eventId: String, // from id
    vevoTimestamp: Date, // from created
    receivedAt: { type: Date, default: Date.now },
    rawPayload: { type: Object }, // full original payload
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

const Notification = mongoose.model('Notification', messageSchema);

export default Notification;
