import httpStatus from 'http-status';
import mongoose from 'mongoose';
import ApiError from '../../../../errors/ApiError';
import { PartnerRelease } from './partnerRelease.model';
import { generateReleaseReference, toPublicRelease } from './partnerRelease.utils';
import { PartnerAuthContext } from '../../../middlewares/partnerAuth';
import { dispatchWebhookEvent } from '../webhook/partnerWebhook.service';
import { PartnerReleaseStatus } from './partnerRelease.model';

type CreateReleaseBody = {
  title: string;
  primaryArtist: string[];
  sourceVideoUrl: string;
  imageUrl: string | null;
  externalId?: string;
  featuringArtists?: string[];
  label?: string;
  genre?: string[];
  language?: string;
  releaseDate?: string;
  isrc?: string;
  channel?: string;
  description?: string;
  keywords?: string[];
  composer?: string;
  producer?: string;
  editor?: string;
  musicDirector?: string;
  copyrightYear?: number;
};

export const createRelease = async (ctx: PartnerAuthContext, body: CreateReleaseBody) => {
  if (body.externalId) {
    const existing = await PartnerRelease.findOne({
      user: ctx.userId,
      externalId: body.externalId,
    });
    if (existing) {
      return { status: 200 as const, message: 'Already created', data: toPublicRelease(existing) };
    }
  }

  const doc = await createWithUniqueReference(ctx, body);
  return {
    status: 201 as const,
    message: 'Release received and queued for review',
    data: toPublicRelease(doc),
  };
};

// Retries on a reference collision (astronomically rare at 900k possible
// values, but cheap to handle) and on a raced duplicate externalId insert
// (two concurrent identical requests) by returning the winner's record.
const createWithUniqueReference = async (ctx: PartnerAuthContext, body: CreateReleaseBody) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await PartnerRelease.create({
        user: ctx.userId,
        partnerKey: ctx.keyId,
        environment: ctx.environment,
        reference: generateReleaseReference(),
        externalId: body.externalId || null,
        title: body.title,
        primaryArtist: body.primaryArtist,
        featuringArtists: body.featuringArtists || [],
        label: body.label || null,
        genre: body.genre || [],
        language: body.language || null,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : null,
        isrc: body.isrc || null,
        channel: body.channel || null,
        description: body.description || null,
        keywords: body.keywords || [],
        composer: body.composer || null,
        producer: body.producer || null,
        editor: body.editor || null,
        musicDirector: body.musicDirector || null,
        copyrightYear: body.copyrightYear || null,
        sourceVideoUrl: body.sourceVideoUrl,
        imageUrl: body.imageUrl,
        status: 'pending',
        statusDetail: 'Waiting for review.',
      });
    } catch (err: any) {
      if (err?.code === 11000 && err?.keyPattern?.reference) {
        continue; // reference collision — retry with a new one
      }
      if (err?.code === 11000 && err?.keyPattern?.externalId) {
        const existing = await PartnerRelease.findOne({
          user: ctx.userId,
          externalId: body.externalId,
        });
        if (existing) return existing;
      }
      throw err;
    }
  }
  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Could not allocate a release reference');
};

export const listReleases = async (
  ctx: PartnerAuthContext,
  query: { updatedSince?: string; isrc?: string; externalId?: string; page?: number; limit?: number },
) => {
  // Environment isolation is enforced here, at the query level, never as a
  // UI/response filter — a test key can never see a live release or vice versa.
  const filter: Record<string, unknown> = { user: ctx.userId, environment: ctx.environment };
  if (query.updatedSince) filter.updatedAt = { $gte: new Date(query.updatedSince) };
  if (query.isrc) filter.isrc = query.isrc;
  if (query.externalId) filter.externalId = query.externalId;

  const page = query.page || 1;
  const limit = query.limit || 25;

  const [items, total] = await Promise.all([
    PartnerRelease.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PartnerRelease.countDocuments(filter),
  ]);

  return {
    releases: items.map(toPublicRelease),
    page,
    limit,
    total,
  };
};

export const getReleaseById = async (ctx: PartnerAuthContext, id: string) => {
  // "Either party's id" (§2.5) — accept both DFS's own id and the caller's
  // externalId through the same path param.
  const idFilters: Record<string, unknown>[] = [{ externalId: id }];
  if (mongoose.isValidObjectId(id)) idFilters.push({ _id: id });

  // Scoped by user AND environment — a test key gets 404 (not 403) on a
  // live release it doesn't own, never leaking that the id exists at all.
  const doc = await PartnerRelease.findOne({
    $or: idFilters,
    user: ctx.userId,
    environment: ctx.environment,
  });
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }
  return toPublicRelease(doc);
};

// A partner may only edit a release we've explicitly kicked back to them —
// never one that's pending review, approved, or in any terminal state.
export const updateReleaseNeedingFix = async (
  ctx: PartnerAuthContext,
  id: string,
  body: Partial<CreateReleaseBody>,
) => {
  const idFilters: Record<string, unknown>[] = [{ externalId: id }];
  if (mongoose.isValidObjectId(id)) idFilters.push({ _id: id });

  const doc = await PartnerRelease.findOne({
    $or: idFilters,
    user: ctx.userId,
    environment: ctx.environment,
  });
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }
  if (doc.status !== 'needs_fix') {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Only a release in needs_fix can be edited (current status: ${doc.status})`,
    );
  }

  const fields: (keyof CreateReleaseBody)[] = [
    'title', 'primaryArtist', 'featuringArtists', 'label', 'genre', 'language',
    'isrc', 'channel', 'description', 'keywords', 'composer', 'producer',
    'editor', 'musicDirector', 'copyrightYear', 'sourceVideoUrl', 'imageUrl',
  ];
  for (const field of fields) {
    if (body[field] !== undefined) (doc as any)[field] = body[field];
  }
  if (body.releaseDate) doc.releaseDate = new Date(body.releaseDate);

  doc.status = 'pending';
  doc.statusDetail = 'Waiting for review.';
  doc.reason = null;
  await doc.save();

  return toPublicRelease(doc);
};

const STATUS_DETAIL: Record<PartnerReleaseStatus, string> = {
  pending: 'Waiting for review.',
  needs_fix: 'Needs changes before it can be approved.',
  approved: 'Approved.',
  delivered: 'Live.',
  rejected: 'Rejected.',
  taken_down: 'Taken down.',
};

const STATUS_EVENT: Partial<Record<PartnerReleaseStatus, string>> = {
  needs_fix: 'release.needs_fix',
  approved: 'release.approved',
  delivered: 'release.delivered',
  rejected: 'release.rejected',
  taken_down: 'release.taken_down',
};

// Test keys only (enforced at the route level) — forces a transition and
// fires the same signed webhook a real one would (§2.5). This is what makes
// the whole system self-verifiable without a human reviewer in the loop.
export const simulateReleaseTransition = async (
  ctx: PartnerAuthContext,
  id: string,
  input: { status: PartnerReleaseStatus; reason?: string },
) => {
  const idFilters: Record<string, unknown>[] = [{ externalId: id }];
  if (mongoose.isValidObjectId(id)) idFilters.push({ _id: id });

  const doc = await PartnerRelease.findOne({
    $or: idFilters,
    user: ctx.userId,
    environment: ctx.environment,
  });
  if (!doc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Release not found');
  }

  doc.status = input.status;
  doc.statusDetail = STATUS_DETAIL[input.status];
  doc.reason = ['needs_fix', 'rejected'].includes(input.status) ? input.reason || null : null;
  await doc.save();

  const event = STATUS_EVENT[input.status];
  if (event) {
    // Fire-and-forget: a partner's broken receiver must never fail this
    // API call, and the webhook's own retry loop can run well past when
    // this response needs to go out.
    dispatchWebhookEvent(ctx.userId, ctx.environment, event, toPublicRelease(doc)).catch(() => {});
  }

  return toPublicRelease(doc);
};
