import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ApiError from '../../../../errors/ApiError';
import { PartnerChannel, PartnerChannelStatus } from './partnerChannel.model';
import { toPublicChannel } from './partnerChannel.utils';
import { PartnerAuthContext } from '../../../middlewares/partnerAuth';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';

// DFS's own documented idempotency rule for channels (§2.6 requires one be
// picked and stated explicitly — this mirrors ANS's own confirmed 409
// behavior): a repeated channelName (case-insensitive) for the same
// account+environment conflicts while a prior request is still `pending` or
// already `approved`. A `rejected` channel can always be resubmitted.
export const createChannel = async (
  ctx: PartnerAuthContext,
  input: { channelName: string; artistName?: string },
) => {
  const existing = await PartnerChannel.findOne({
    user: ctx.userId,
    environment: ctx.environment,
    channelName: { $regex: `^${escapeRegex(input.channelName)}$`, $options: 'i' },
    status: { $in: ['pending', 'approved'] },
  });

  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `You have already submitted ${input.channelName}. It is ${existing.status}.`,
    );
  }

  const doc = await PartnerChannel.create({
    user: ctx.userId,
    partnerKey: ctx.keyId,
    environment: ctx.environment,
    channelName: input.channelName,
    artistName: input.artistName || null,
    status: 'pending',
  });

  return toPublicChannel(doc);
};

export const listChannels = async (ctx: PartnerAuthContext) => {
  const channels = await PartnerChannel.find({
    user: ctx.userId,
    environment: ctx.environment,
  }).sort({ createdAt: -1 });

  return { channels: channels.map(toPublicChannel) };
};

// Test keys only (enforced at the route level) — lets a partner move their
// own test channel request through review without waiting on a human,
// mirroring release simulate.
export const simulateChannelTransition = async (
  ctx: PartnerAuthContext,
  id: string,
  input: { status: PartnerChannelStatus },
) => {
  const doc = await PartnerChannel.findOne({
    _id: mongoose.isValidObjectId(id) ? id : null,
    user: ctx.userId,
    environment: ctx.environment,
  });
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Channel request not found');
  }

  doc.status = input.status;
  await doc.save();

  const event = input.status === 'approved' ? 'channel.approved' : input.status === 'rejected' ? 'channel.rejected' : null;
  if (event) {
    dispatchWebhookEvent(ctx.userId, ctx.environment, event, toPublicChannel(doc)).catch(() => {});
  }

  return toPublicChannel(doc);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
