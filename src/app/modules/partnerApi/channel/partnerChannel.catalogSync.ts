import { Schema } from 'mongoose';
import { PartnerChannel } from './partnerChannel.model';
import { toPublicChannel } from './partnerChannel.utils';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';

// Attach to the vevo-channel schema (once, before `model()`) so that when an
// admin approves/rejects a channel through the *existing* Manage Channels
// screen — via `Channel.findOneAndUpdate`, same call every other admin
// action there already uses — a linked PartnerChannel picks up the real
// outcome automatically, instead of a second decision on Partner Requests.
export const attachPartnerChannelCatalogSync = (schema: Schema) => {
  schema.pre('findOneAndUpdate', async function (next) {
    // @ts-ignore
    this._partnerPrevDoc = await this.model.findOne(this.getQuery()).lean();
    next();
  });

  schema.post('findOneAndUpdate', function (doc: any) {
    if (!doc) return;
    // @ts-ignore
    const prev = this._partnerPrevDoc;
    if (!prev) return;
    syncChannelChangeToPartnerChannel(doc, prev).catch(() => {});
  });
};

const syncChannelChangeToPartnerChannel = async (doc: any, prev: any) => {
  if (doc.isApproved === prev.isApproved) return;
  if (!['approved', 'rejected'].includes(doc.isApproved)) return;

  const partnerChannel = await PartnerChannel.findOne({ catalogChannelId: doc._id });
  if (!partnerChannel) return; // this channel didn't come from the Partner API.

  // Intake ("Send to Catalog") already set status to `approved` — the real
  // channel details (URL, YouTube id) only exist now, so merge them even
  // when the status itself isn't changing. Only the status+webhook path is
  // skipped when there's genuinely nothing new to report.
  const statusChanged = partnerChannel.status !== doc.isApproved;
  const urlChanged = doc.youtubeLink && partnerChannel.channelUrl !== doc.youtubeLink;
  if (!statusChanged && !urlChanged) return;

  partnerChannel.status = doc.isApproved;
  if (doc.youtubeLink) partnerChannel.channelUrl = doc.youtubeLink;
  await partnerChannel.save();

  // Only a genuine status transition is a reportable event — a later edit
  // to just the URL isn't something the partner needs re-notified about.
  if (!statusChanged) return;

  const event = doc.isApproved === 'approved' ? 'channel.approved' : 'channel.rejected';
  dispatchWebhookEvent(
    String(partnerChannel.user),
    partnerChannel.environment,
    event,
    toPublicChannel(partnerChannel),
  ).catch(() => {});
};
