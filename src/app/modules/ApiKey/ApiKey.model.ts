import mongoose, { Schema } from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accessKey: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: {
    type: [String],
    default: ['song:create', 'song:update'],
    enum: ['song:create', 'song:update', 'song:read', 'song:delete'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 365 * 24 * 60 * 60, // 1 year expiration
  },
});

ApiKeySchema.index({ companyName: 1, accessKey: 1 });

export const ApiKey = mongoose.model('ApiKey', ApiKeySchema);
