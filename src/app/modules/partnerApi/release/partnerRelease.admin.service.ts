import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiError';
import { PartnerRelease, PartnerReleaseStatus, PARTNER_RELEASE_STATUSES } from './partnerRelease.model';
import { toPublicRelease } from './partnerRelease.utils';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';
import { Video } from '../../videos/videos.model';
import { generateUniqueVideoId } from '../../../../utils/videoId';

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

type ListQuery = { status?: string; environment?: 'live' | 'test'; page?: number; limit?: number };

export const listPartnerReleasesForAdmin = async (query: ListQuery) => {
  const filter: Record<string, unknown> = {};
  if (query.status && (PARTNER_RELEASE_STATUSES as readonly string[]).includes(query.status)) {
    filter.status = query.status;
  }
  if (query.environment === 'live' || query.environment === 'test') {
    filter.environment = query.environment;
  }

  const page = query.page || 1;
  const limit = query.limit || 25;

  const [items, total] = await Promise.all([
    PartnerRelease.find(filter)
      .populate('user', 'name email channelName')
      .populate('partnerKey', 'label keyPrefix')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PartnerRelease.countDocuments(filter),
  ]);

  return { releases: items, page, limit, total };
};

// A live release, once approved, joins the same catalogue every other video
// already goes through — same admin listings, same VEVO-transfer tooling.
// Test releases never touch this collection, matching the promise made in
// the client doc ("never visible in a real catalogue or report").
const syncApprovedLiveReleaseToCatalog = async (doc: InstanceType<typeof PartnerRelease>) => {
  if (doc.catalogVideoId) return; // already synced — never create a second Video for the same release.

  // The catalog's Video model requires a real cover image — a placeholder
  // would just be wrong data sitting in the real catalogue. Ask for one
  // rather than fabricate it.
  if (!doc.imageUrl) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This release has no cover image yet — ask the partner to resend with imageUrl before approving.',
    );
  }

  const video = await Video.create({
    user: doc.user,
    image: doc.imageUrl,
    video: doc.sourceVideoUrl,
    videoId: await generateUniqueVideoId(),
    title: doc.title,
    primaryArtist: doc.primaryArtist,
    featuringArtists: doc.featuringArtists,
    composer: doc.composer || undefined,
    musicDirector: doc.musicDirector || undefined,
    producer: doc.producer || undefined,
    editor: doc.editor || undefined,
    label: doc.label || undefined,
    // Video.genre is a single string; a partner release can carry several.
    genre: doc.genre.join(', ') || 'Unspecified',
    language: doc.language || undefined,
    isrc: doc.isrc || undefined,
    releaseDate: doc.releaseDate ? doc.releaseDate.toISOString() : undefined,
    vevoChannel: doc.channel || undefined,
    keywords: doc.keywords,
    description: doc.description || undefined,
    copyrightYear: doc.copyrightYear ? String(doc.copyrightYear) : undefined,
    // No internal repertoire owner exists for a partner-submitted release —
    // the label (or the partner's own account name) is the closest analog.
    repertoireOwner: doc.label || 'Partner API',
    // Lands in the same Pending Video queue every other upload goes through —
    // a real reviewer decides approve/reject/take-down there, exactly as
    // they already do. That decision is synced back automatically (see
    // partnerRelease.catalogSync.ts), not decided here.
    isApproved: 'pending',
  });

  doc.catalogVideoId = video._id as any;
};

export const adminUpdateReleaseStatus = async (
  id: string,
  input: { status: PartnerReleaseStatus; reason?: string; videoUrl?: string },
) => {
  const doc = await PartnerRelease.findById(id);
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }

  doc.status = input.status;
  doc.statusDetail = STATUS_DETAIL[input.status];
  doc.reason = ['needs_fix', 'rejected'].includes(input.status) ? input.reason || null : null;
  if (input.status === 'delivered' && input.videoUrl) {
    doc.videoUrl = input.videoUrl;
  }

  // "Approved" here means "accepted the submission, sent into the real
  // content-review pipeline" — not "content reviewed and cleared." The
  // actual approve/reject/take-down decision happens on the existing
  // Pending Video screen, and flows back onto this record automatically.
  if (input.status === 'approved' && doc.environment === 'live') {
    await syncApprovedLiveReleaseToCatalog(doc);
  }

  await doc.save();

  const event = STATUS_EVENT[input.status];
  if (event) {
    dispatchWebhookEvent(String(doc.user), doc.environment, event, toPublicRelease(doc)).catch(() => {});
  }

  return toPublicRelease(doc);
};
