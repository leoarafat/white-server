import { Schema } from 'mongoose';
import { PartnerRelease, PartnerReleaseStatus } from './partnerRelease.model';
import { toPublicRelease } from './partnerRelease.utils';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';
import { CorrectionVideoContent } from '../../catalog-video/catalog-video.model';

const STATUS_DETAIL: Record<PartnerReleaseStatus, string> = {
  pending: 'Waiting for review.',
  in_review: 'Being reviewed by ARP Music.',
  needs_fix: 'Needs changes before it can be approved.',
  approved: 'Approved.',
  delivered: 'Live.',
  rejected: 'Rejected.',
  taken_down: 'Taken down.',
};

const STATUS_EVENT: Partial<Record<PartnerReleaseStatus, string>> = {
  in_review: 'release.in_review',
  needs_fix: 'release.needs_fix',
  approved: 'release.approved',
  delivered: 'release.delivered',
  rejected: 'release.rejected',
  taken_down: 'release.taken_down',
};

// Attach to the Video schema (once, before `model()`) so that whenever an
// admin acts on a video through the *existing* catalog screens — Pending
// Video's approve/in-review/correction actions, or the take-down toggle —
// via `Video.findOneAndUpdate`, same call every one of those already uses —
// a linked PartnerRelease (one created from a live partner submission)
// picks up the real outcome automatically, instead of requiring a second,
// duplicate decision on the Partner Requests page.
export const attachPartnerReleaseCatalogSync = (schema: Schema) => {
  schema.pre('findOneAndUpdate', async function (next) {
    // @ts-ignore - stash the pre-update doc on the query for the post hook
    this._partnerPrevDoc = await this.model.findOne(this.getQuery()).lean();
    next();
  });

  schema.post('findOneAndUpdate', function (doc: any) {
    if (!doc) return;
    // @ts-ignore
    const prev = this._partnerPrevDoc;
    if (!prev) return;
    syncVideoChangeToPartnerRelease(doc, prev).catch(() => {});
  });
};

const syncVideoChangeToPartnerRelease = async (doc: any, prev: any) => {
  const release = await PartnerRelease.findOne({ catalogVideoId: doc._id });
  if (!release) return; // this video didn't come from the Partner API.

  let nextStatus: PartnerReleaseStatus | null = null;
  let reason: string | null = null;

  if (doc.isApproved !== prev.isApproved) {
    if (doc.isApproved === 'approved') nextStatus = 'approved';
    else if (doc.isApproved === 'rejected') nextStatus = 'rejected';
    else if (doc.isApproved === 'in_review') nextStatus = 'in_review';
  }

  // A correction request is this platform's real "needs_fix" — an admin
  // sends the release back with a message, expecting a resubmission, same
  // as the partner-facing PATCH /:id/edit flow. Pull the actual message so
  // the partner sees the same text the admin wrote, not a generic one.
  if (doc.isCorrection && !prev.isCorrection) {
    nextStatus = 'needs_fix';
    const correction = await CorrectionVideoContent.findOne({ contentId: doc._id }).sort({ _id: -1 });
    reason = correction?.message || 'Changes requested.';
  }

  // videoStatus takes precedence — a take-down or delivery matters more
  // than whatever isApproved/isCorrection happen to still carry.
  if (doc.videoStatus !== prev.videoStatus) {
    if (doc.videoStatus === 'distribute') nextStatus = 'delivered';
    else if (doc.videoStatus === 'take-down') nextStatus = 'taken_down';
  }

  if (!nextStatus || nextStatus === release.status) return;

  release.status = nextStatus;
  release.statusDetail = STATUS_DETAIL[nextStatus];
  release.reason = ['needs_fix', 'rejected'].includes(nextStatus) ? reason : null;
  if (nextStatus === 'delivered' && doc.youtubeLink) {
    release.videoUrl = doc.youtubeLink;
  }
  await release.save();

  const event = STATUS_EVENT[nextStatus];
  if (event) {
    dispatchWebhookEvent(String(release.user), release.environment, event, toPublicRelease(release)).catch(() => {});
  }
};
