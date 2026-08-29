import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { PartnerChannel, PARTNER_CHANNEL_STATUSES } from './partnerChannel.model';
import { toPublicChannel } from './partnerChannel.utils';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';
import { Channel } from '../../vevo-channel/vevo-channel.model';
import { generateArtistId } from '../../../../utils/uniqueId';

type ListQuery = { status?: string; environment?: 'live' | 'test'; page?: number; limit?: number };

export const listPartnerChannelsForAdmin = async (query: ListQuery) => {
  const filter: Record<string, unknown> = {};
  if (query.status && (PARTNER_CHANNEL_STATUSES as readonly string[]).includes(query.status)) {
    filter.status = query.status;
  }
  if (query.environment === 'live' || query.environment === 'test') {
    filter.environment = query.environment;
  }

  const page = query.page || 1;
  const limit = query.limit || 25;

  const [items, total] = await Promise.all([
    PartnerChannel.find(filter)
      .populate('user', 'name email channelName')
      .populate('partnerKey', 'label keyPrefix')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PartnerChannel.countDocuments(filter),
  ]);

  return { channels: items, page, limit, total };
};

// A live channel request, once accepted, joins the same "Manage Channels"
// review queue every other channel request already goes through — a real
// reviewer there decides approve/reject, synced back automatically (see
// partnerChannel.catalogSync.ts). Test requests never touch this collection.
const syncAcceptedLiveChannelToCatalog = async (doc: InstanceType<typeof PartnerChannel>) => {
  if (doc.catalogChannelId) return; // already synced.

  const channel = await Channel.create({
    user: doc.user,
    channelName: doc.channelName,
    channelId: generateArtistId(),
    description: doc.artistName ? `Requested for artist: ${doc.artistName}` : undefined,
    isApproved: 'pending',
  });

  doc.catalogChannelId = channel._id as any;
};

export const adminUpdateChannelStatus = async (
  id: string,
  input: { status: 'pending' | 'approved' | 'rejected'; channelUrl?: string; youtubeChannelId?: string },
) => {
  const doc = await PartnerChannel.findById(id);
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Channel request not found');
  }

  doc.status = input.status;
  if (input.channelUrl !== undefined) doc.channelUrl = input.channelUrl;
  if (input.youtubeChannelId !== undefined) doc.youtubeChannelId = input.youtubeChannelId;

  // "Approved" here means "accepted, sent to Manage Channels for real
  // setup" — the actual approve/reject decision happens on that existing
  // screen and flows back onto this record automatically.
  if (input.status === 'approved' && doc.environment === 'live') {
    await syncAcceptedLiveChannelToCatalog(doc);
  }

  await doc.save();

  const event = input.status === 'approved' ? 'channel.approved' : input.status === 'rejected' ? 'channel.rejected' : null;
  if (event) {
    dispatchWebhookEvent(String(doc.user), doc.environment, event, toPublicChannel(doc)).catch(() => {});
  }

  return toPublicChannel(doc);
};
