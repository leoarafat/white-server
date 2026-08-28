import ApiError from '../../../errors/ApiError';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import { CorrectionContent } from '../catalogs/correction.model';
import User from '../user/user.model';
import {
  notifyAdminsOfSubmission,
  notifyEntityStatusChange,
} from '../notifications/notification.hooks';

export type ReleaseType = 'audio' | 'video';

// Typed as `any`: TypeScript can't unify SingleTrack's and Video's
// overloaded static Model methods (findById/findOneAndUpdate/etc.) across a
// union, even though both are plain Mongoose Models — this sidesteps that
// purely-structural type error, real safety comes from the runtime `type`
// switch, not from static typing here.
const modelFor = (type: ReleaseType): any =>
  type === 'audio' ? SingleTrack : Video;

const entityTypeFor = (type: ReleaseType) =>
  type === 'audio' ? ('single-track' as const) : ('video' as const);

// A master may only act on releases uploaded by one of THEIR OWN sub-users —
// never another master's sub-user, and never a release the master uploaded
// directly (those skip this whole review step, see upload.service changes).
const assertIsOwnSubUsersUpload = async (
  ownerId: unknown,
  masterId: string,
) => {
  const uploader = await User.findById(ownerId).select('user role').lean();
  if (
    !uploader ||
    uploader.role !== 'sub-user' ||
    String(uploader.user) !== masterId
  ) {
    throw new ApiError(403, "This isn't your sub-user's upload");
  }
};

const listForMaster = async (
  masterId: string,
  filters: { status?: string; type?: ReleaseType },
) => {
  const subUsers = await User.find({ user: masterId, role: 'sub-user' })
    .select('_id name email')
    .lean();
  const subUserIds = subUsers.map(u => u._id);
  const subUserById = new Map(subUsers.map(u => [String(u._id), u]));

  const statusFilter =
    filters.status && ['pending', 'approved', 'rejected'].includes(filters.status)
      ? filters.status
      : undefined;

  const baseMatch: Record<string, unknown> = { user: { $in: subUserIds } };
  if (statusFilter) baseMatch.masterApprovalStatus = statusFilter;

  const wantAudio = !filters.type || filters.type === 'audio';
  const wantVideo = !filters.type || filters.type === 'video';

  const [audio, video] = await Promise.all([
    wantAudio ? SingleTrack.find(baseMatch).sort({ createdAt: -1 }).lean() : [],
    wantVideo ? Video.find(baseMatch).sort({ createdAt: -1 }).lean() : [],
  ]);

  const attachSubUser = (doc: any) => ({
    ...doc,
    subUser: subUserById.get(String(doc.user)) ?? null,
  });

  return {
    audio: audio.map(a => ({ ...attachSubUser(a), contentType: 'audio' })),
    video: video.map(v => ({ ...attachSubUser(v), contentType: 'video' })),
  };
};

const approve = async (type: ReleaseType, id: string, masterId: string) => {
  const Model = modelFor(type);
  const doc = await Model.findById(id);
  if (!doc) throw new ApiError(404, 'Release not found');
  await assertIsOwnSubUsersUpload(doc.user, masterId);
  if (doc.masterApprovalStatus !== 'pending') {
    throw new ApiError(400, 'This release has already been reviewed');
  }

  doc.masterApprovalStatus = 'approved';
  await doc.save();

  notifyEntityStatusChange({
    entityType: entityTypeFor(type),
    entityId: id,
    entityName: (doc as any).title,
    ownerId: String(doc.user),
    oldStatus: 'pending',
    newStatus: 'approved',
  }).catch(() => undefined);

  // Only now does it enter the existing admin pipeline — the upload step
  // deliberately withheld this notification for sub-user uploads.
  notifyAdminsOfSubmission({
    entityType: entityTypeFor(type),
    entityId: id,
    entityName: (doc as any).title,
  }).catch(() => undefined);

  return doc;
};

const reject = async (
  type: ReleaseType,
  id: string,
  masterId: string,
  reason: string,
) => {
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'A rejection reason is required');
  }
  const Model = modelFor(type);
  const doc = await Model.findById(id);
  if (!doc) throw new ApiError(404, 'Release not found');
  await assertIsOwnSubUsersUpload(doc.user, masterId);
  if (doc.masterApprovalStatus !== 'pending') {
    throw new ApiError(400, 'This release has already been reviewed');
  }

  doc.masterApprovalStatus = 'rejected';
  await doc.save();

  // Reused from the admin-correction flow (`server/.../catalogs/correction.model.ts`)
  // — same shape, same `contentId`-keyed lookup pattern, just now also written
  // by a master instead of only an admin.
  await CorrectionContent.create({
    contentId: doc._id,
    user: doc.user,
    title: (doc as any).title || 'Release',
    message: reason.trim(),
  });

  notifyEntityStatusChange({
    entityType: entityTypeFor(type),
    entityId: id,
    entityName: (doc as any).title,
    ownerId: String(doc.user),
    oldStatus: 'pending',
    newStatus: 'rejected',
  }).catch(() => undefined);

  return doc;
};

// NOTE on "view reason" / "resubmit": deliberately NOT duplicated here.
// Rejection reasons are written into the same `CorrectionContent` collection
// the admin-correction flow already uses (see `reject` above), so the
// existing `GET catalog-music/correction-data/:id` /
// `GET catalog-video/correction-data/:id` endpoints already serve them
// as-is. Resubmission reuses the existing `editMusic` (catalog.service.ts)
// / `editVideo` (catalog-video.service.ts) endpoints, which now also reset
// `masterApprovalStatus` back to 'pending' when it was 'rejected' — so the
// sub-user gets the exact same edit form (EditAudio.tsx/EditVideo.tsx) and
// flow they'd use after an admin correction, no new UI needed.

export const MasterReviewService = {
  listForMaster,
  approve,
  reject,
};
