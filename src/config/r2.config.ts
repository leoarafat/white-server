/* eslint-disable @typescript-eslint/ban-ts-comment */

import { S3Client } from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';

import config from '.';

// Cloudflare R2 — S3-compatible API. `region` must be 'auto' and
// forcePathStyle must be true (R2 doesn't support virtual-hosted-style URLs).
//@ts-ignore
export const s3Client = new S3Client({
  //@ts-ignore
  region: config.r2.region || 'auto',
  endpoint: config.r2.endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});
export const s3 = new S3({
  accessKeyId: config.r2.accessKeyId,
  secretAccessKey: config.r2.secretAccessKey,
  region: config.r2.region || 'auto',
  endpoint: config.r2.endpoint,
  s3ForcePathStyle: true,
});
