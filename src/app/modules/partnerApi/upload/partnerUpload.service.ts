import crypto from 'crypto';
import path from 'path';
import httpStatus from 'http-status';
import {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../../../../config';
import ApiError from '../../../../errors/ApiError';
import { s3Client } from '../../../../config/r2.config';
import { PartnerAuthContext } from '../../../middlewares/partnerAuth';

const BUCKET = config.r2.bucketName as string;
const PUBLIC_BASE = (config.r2.publicUrl as string)?.replace(/\/$/, '');
const PRESIGN_EXPIRY = 900; // 15 minutes — tighter than the internal upload flow's, since this is external partner traffic.
const SINGLE_FILE_MAX_BYTES = 50 * 1024 * 1024;
const MULTIPART_PART_SIZE = 10 * 1024 * 1024;

const publicFileUrl = (key: string) => `${PUBLIC_BASE}/${key}`;

// Every object key is namespaced by environment + owning account, generated
// server-side — never accept a client-supplied key. This is what keeps one
// partner from ever guessing or reaching another partner's upload path.
const makeKey = (ctx: PartnerAuthContext, category: string | undefined, fileName: string) => {
  const parsed = path.parse(fileName);
  const clean = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'file';
  const unique = crypto.randomBytes(8).toString('hex');
  const safeCategory = category || 'other';
  return `partner-uploads/${ctx.environment}/${ctx.userId}/${safeCategory}/${unique}-${clean}${parsed.ext}`;
};

const assertOwnedKey = (ctx: PartnerAuthContext, key: string) => {
  const ownPrefix = `partner-uploads/${ctx.environment}/${ctx.userId}/`;
  if (!key.startsWith(ownPrefix)) {
    // 404, not 403 — never confirm that a foreign key exists at all.
    throw new ApiError(httpStatus.NOT_FOUND, 'Upload session not found');
  }
};

type StartUploadInput = {
  fileName: string;
  contentType?: string;
  category?: string;
  size?: number;
};

export const startUpload = async (ctx: PartnerAuthContext, input: StartUploadInput) => {
  const key = makeKey(ctx, input.category, input.fileName);

  // A missing size is deliberately treated as "large" — a wrong guess must
  // fail fast at the start of the flow, not partway through a broken PUT.
  const isSmallAndSized =
    typeof input.size === 'number' && input.size > 0 && input.size < SINGLE_FILE_MAX_BYTES;

  if (isSmallAndSized) {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: input.contentType,
    });
    //@ts-ignore — known type mismatch between the pinned client-s3/s3-request-presigner versions, harmless at runtime (see resumable-upload.service.ts)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY });
    return { mode: 'single' as const, uploadUrl, fileUrl: publicFileUrl(key) };
  }

  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: input.contentType,
  });
  const response = await s3Client.send(command);
  if (!response.UploadId) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to initiate multipart upload');
  }

  return {
    mode: 'multipart' as const,
    key,
    uploadId: response.UploadId,
    partSize: MULTIPART_PART_SIZE,
    fileUrl: publicFileUrl(key),
  };
};

export const signUploadParts = async (
  ctx: PartnerAuthContext,
  input: { key: string; uploadId: string; partNumbers: number[] },
) => {
  assertOwnedKey(ctx, input.key);

  const parts = await Promise.all(
    input.partNumbers.map(async partNumber => {
      const command = new UploadPartCommand({
        Bucket: BUCKET,
        Key: input.key,
        UploadId: input.uploadId,
        PartNumber: partNumber,
      });
      //@ts-ignore — known type mismatch between the pinned client-s3/s3-request-presigner versions, harmless at runtime (see resumable-upload.service.ts)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGN_EXPIRY });
      return { partNumber, uploadUrl };
    }),
  );

  return { parts };
};

export const completeUpload = async (
  ctx: PartnerAuthContext,
  input: { key: string; uploadId: string; parts: { partNumber: number; eTag: string }[] },
) => {
  assertOwnedKey(ctx, input.key);

  const sorted = [...input.parts].sort((a, b) => a.partNumber - b.partNumber);
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: input.key,
    UploadId: input.uploadId,
    MultipartUpload: {
      Parts: sorted.map(p => ({ PartNumber: p.partNumber, ETag: p.eTag })),
    },
  });

  await s3Client.send(command);
  return { fileUrl: publicFileUrl(input.key) };
};
