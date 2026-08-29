import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { PartnerChannel } from './partnerChannel.model';
import { toPublicChannel } from './partnerChannel.utils';
import { PartnerAuthContext } from '../../../middlewares/partnerAuth';

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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
