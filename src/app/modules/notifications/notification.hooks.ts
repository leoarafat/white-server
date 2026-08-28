import { Schema } from 'mongoose';
import { notificationService } from './notification.service';
import { NotificationType } from './notification.interface';

const STATUS_LABEL: Record<string, string> = {
  approved: 'approved',
  rejected: 'rejected',
  pending: 'submitted for review',
  blocked: 'blocked',
  'take-down': 'taken down',
};

const STATUS_TO_TYPE: Record<string, NotificationType> = {
  approved: 'approval',
  rejected: 'rejection',
  blocked: 'block',
  'take-down': 'takedown',
};

const ENTITY_LABEL: Record<string, string> = {
  'single-track': 'Track',
  album: 'Album',
  video: 'Video',
  'catalog-video': 'Video',
  'primary-artist': 'Artist',
  label: 'Label',
  'vevo-channel': 'Channel',
};

const ENTITY_LINK: Record<string, string> = {
  'single-track': '/my-uploads',
  album: '/my-uploads',
  video: '/my-uploads/videos',
  'catalog-video': '/my-uploads/videos',
  'primary-artist': '/artist-management',
  label: '/artist-management',
  'vevo-channel': '/artist-management',
};

// Called from a module's admin-facing update function right after a status
// field (isApproved/videoStatus/etc.) actually changes, to notify the owner.
export const notifyEntityStatusChange = async (params: {
  entityType: keyof typeof ENTITY_LABEL;
  entityId: string;
  entityName?: string;
  ownerId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
}) => {
  const { entityType, entityId, entityName, ownerId, oldStatus, newStatus } =
    params;

  if (!ownerId || !newStatus || newStatus === oldStatus) return;

  const label = STATUS_LABEL[newStatus] || newStatus;
  const entityLabel = ENTITY_LABEL[entityType] || 'Item';
  const name = entityName ? ` "${entityName}"` : '';

  await notificationService.createAndEmitNotification({
    recipientId: ownerId,
    recipientModel: 'User',
    type: STATUS_TO_TYPE[newStatus] || 'submission',
    title: `${entityLabel} ${label}`,
    message: `Your ${entityLabel.toLowerCase()}${name} has been ${label}.`,
    entityType,
    entityId,
    link: ENTITY_LINK[entityType] || '/my-uploads',
  });
};

// Called when a user creates/submits something, to notify the admin pool.
export const notifyAdminsOfSubmission = async (params: {
  entityType: keyof typeof ENTITY_LABEL;
  entityId: string;
  entityName?: string;
  submitterName?: string;
}) => {
  const { entityType, entityId, entityName, submitterName } = params;
  const entityLabel = ENTITY_LABEL[entityType] || 'Item';
  const name = entityName ? ` "${entityName}"` : '';
  const by = submitterName ? ` by ${submitterName}` : '';

  await notificationService.createAndEmitNotification({
    recipientModel: 'Admin',
    type: 'submission',
    title: `New ${entityLabel.toLowerCase()} submission`,
    message: `${entityLabel}${name} was submitted${by} for review.`,
    entityType,
    entityId,
  });
};

// Attach once to a model's schema (right before `model(...)`) to auto-notify
// the owning user whenever ANY admin action changes its status field via
// findOneAndUpdate — covers every current and future approve/reject/block/
// take-down code path in that module without having to hunt each one down.
export const attachStatusChangeHook = (
  schema: Schema,
  entityType: keyof typeof ENTITY_LABEL,
  opts: {
    statusField: string;
    titleField?: string;
    secondaryStatusField?: string;
    secondaryTakeDownValue?: string;
  },
) => {
  schema.pre('findOneAndUpdate', async function (next) {
    // @ts-ignore - stash the pre-update doc on the query for the post hook
    this._prevDoc = await this.model.findOne(this.getQuery()).lean();
    next();
  });

  schema.post('findOneAndUpdate', function (doc: any) {
    if (!doc) return;
    // @ts-ignore
    const prev = this._prevDoc;
    if (!prev) return;

    const {
      statusField,
      titleField,
      secondaryStatusField,
      secondaryTakeDownValue,
    } = opts;

    let newStatus = doc[statusField];
    let oldStatus = prev[statusField];

    if (
      secondaryStatusField &&
      secondaryTakeDownValue &&
      doc[secondaryStatusField] === secondaryTakeDownValue &&
      prev[secondaryStatusField] !== secondaryTakeDownValue
    ) {
      newStatus = 'take-down';
      oldStatus = prev[secondaryStatusField];
    }

    notifyEntityStatusChange({
      entityType,
      entityId: doc._id.toString(),
      entityName: titleField ? doc[titleField] : undefined,
      ownerId: doc.user ? String(doc.user) : undefined,
      oldStatus,
      newStatus,
    }).catch(() => undefined);
  });
};

export const notifyUserOfReport = async (params: {
  userId: string;
  periodLabel?: string;
}) => {
  await notificationService.createAndEmitNotification({
    recipientId: params.userId,
    recipientModel: 'User',
    type: 'report',
    title: 'New revenue report available',
    message: params.periodLabel
      ? `Your revenue report for ${params.periodLabel} has been uploaded.`
      : 'A new revenue report has been uploaded for your account.',
    link: '/analytics',
  });
};
