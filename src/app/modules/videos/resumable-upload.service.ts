/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import path from 'path';
import { generateArtistId } from '../../../utils/uniqueId';
import { generateUniqueVideoId } from '../../../utils/videoId';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { s3Client } from '../../../config/r2.config';
import User from '../user/user.model';
import { Video } from './videos.model';

const BUCKET = config.r2.bucketName as string;
const PUBLIC_BASE = (config.r2.publicUrl as string)?.replace(/\/$/, '');
const PRESIGN_EXPIRY = 3600; // 1 hour — generous for slow connections

// R2's S3 API endpoint isn't publicly readable — files must be served
// through the R2 public URL (custom domain / r2.dev), not the API endpoint.
const publicFileUrl = (s3Key: string) => `${PUBLIC_BASE}/${s3Key}`;

// ─── Helper: generate a clean S3 key ────────────────────────────────
function makeS3Key(prefix: string, originalName: string): string {
  const clientId = generateArtistId();
  const parsed = path.parse(originalName);
  const clean = parsed.name.replace(/[^a-zA-Z0-9]/g, '') + parsed.ext;
  return `${prefix}${clientId}-${clean}`;
}

// ─── 1. Initiate multipart upload ───────────────────────────────────
// Client sends: { fileName, fileType, fileCategory: 'video' | 'image' }
// Returns: { uploadId, s3Key }
const initiateUpload = async (body: {
  fileName: string;
  fileType: string;
  fileCategory: 'video' | 'image';
}) => {
  const { fileName, fileType, fileCategory } = body;

  if (!fileName || !fileType || !fileCategory) {
    throw new ApiError(
      400,
      'fileName, fileType, and fileCategory are required',
    );
  }

  const prefix =
    fileCategory === 'video' ? 'uploads/videos/' : 'uploads/images/image/';
  const s3Key = makeS3Key(prefix, fileName);

  // For small images (< 10 MB) use a single presigned PUT instead
  // For videos always use multipart
  if (fileCategory === 'image') {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: fileType,
    });
    //@ts-ignore
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRY,
    });

    return {
      mode: 'single' as const,
      presignedUrl,
      s3Key,
      fileUrl: publicFileUrl(s3Key),
    };
  }

  // Multipart for video
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: fileType,
  });

  const response = await s3Client.send(command);

  if (!response.UploadId) {
    throw new ApiError(500, 'Failed to initiate multipart upload');
  }

  return {
    mode: 'multipart' as const,
    uploadId: response.UploadId,
    s3Key,
    fileUrl: publicFileUrl(s3Key),
  };
};

// ─── 2. Get presigned URL for a single part ─────────────────────────
// Client sends: { uploadId, s3Key, partNumber }
// Returns: { presignedUrl }
const getPresignedUrl = async (body: {
  uploadId: string;
  s3Key: string;
  partNumber: number;
}) => {
  const { uploadId, s3Key, partNumber } = body;

  if (!uploadId || !s3Key || !partNumber) {
    throw new ApiError(400, 'uploadId, s3Key, and partNumber are required');
  }

  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: s3Key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  //@ts-ignore
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGN_EXPIRY,
  });

  return { presignedUrl };
};

// ─── 3. Complete multipart upload + save video to DB ────────────────
// Client sends: { uploadId, s3Key, parts: [{PartNumber, ETag}], videoData: {...} }
const completeUpload = async (
  body: {
    // Video file info
    uploadId: string;
    videoS3Key: string;
    parts: { PartNumber: number; ETag: string }[];
    // Image URL (already uploaded via single presigned PUT)
    imageUrl: string;
    // All video metadata
    videoData: Record<string, any>;
  },
  userId: string,
) => {
  const { uploadId, videoS3Key, parts, imageUrl, videoData } = body;

  // Validate user
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!uploadId || !videoS3Key || !parts?.length) {
    throw new ApiError(
      400,
      'uploadId, videoS3Key, and parts array are required',
    );
  }

  if (!imageUrl) {
    throw new ApiError(400, 'imageUrl is required (upload thumbnail first)');
  }

  // Sort parts by PartNumber (S3 requires this)
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

  // Complete the multipart upload on S3
  const completeCommand = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: videoS3Key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts.map(p => ({
        PartNumber: p.PartNumber,
        ETag: p.ETag,
      })),
    },
  });

  await s3Client.send(completeCommand);
  const videoUrl = publicFileUrl(videoS3Key);

  // Parse artists
  let primaryArtist = videoData.primaryArtist;
  let featuringArtists = videoData.featuringArtists;

  if (typeof primaryArtist === 'string') {
    try {
      primaryArtist = JSON.parse(primaryArtist);
    } catch {
      primaryArtist = primaryArtist.split(',');
    }
  }
  if (typeof featuringArtists === 'string') {
    try {
      featuringArtists = JSON.parse(featuringArtists);
    } catch {
      featuringArtists = featuringArtists.split(',');
    }
  }

  const primaryArtistArray = Array.isArray(primaryArtist)
    ? primaryArtist
    : primaryArtist
      ? [primaryArtist]
      : [];

  // Clean empty strings
  const cleanedData = { ...videoData };
  Object.keys(cleanedData).forEach(key => {
    if (cleanedData[key] === '') {
      delete cleanedData[key];
    }
  });

  // Remove fields we handle separately
  delete cleanedData.primaryArtist;
  delete cleanedData.featuringArtists;

  // Save to database
  // Never trust a client-supplied videoId — the server owns this field.
  delete cleanedData.videoId;

  const result = await Video.create({
    ...cleanedData,
    videoId: await generateUniqueVideoId(),
    primaryArtist: primaryArtistArray,
    featuringArtists: featuringArtists || [],
    user: userId,
    video: videoUrl,
    image: imageUrl,
  });

  return result;
};

// ─── 4. Abort upload (cleanup) ──────────────────────────────────────
const abortUpload = async (body: { uploadId: string; s3Key: string }) => {
  const { uploadId, s3Key } = body;

  if (!uploadId || !s3Key) {
    throw new ApiError(400, 'uploadId and s3Key are required');
  }

  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: s3Key,
    UploadId: uploadId,
  });

  await s3Client.send(command);
  return { message: 'Upload aborted and cleaned up' };
};

export const ResumableUploadService = {
  initiateUpload,
  getPresignedUrl,
  completeUpload,
  abortUpload,
};
