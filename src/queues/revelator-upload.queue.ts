import { Queue } from 'bullmq';
import { redisConnection } from './redis.connection';

export const REVELATOR_UPLOAD_QUEUE_NAME = 'revelator-upload-queue';

export type RevelatorUploadJobData = {
  trackId: string;
  adminId: string;
};

export type RevelatorUploadPhase =
  | 'queued'
  | 'logging_in'
  | 'downloading'
  | 'uploading_asset'
  | 'creating_release'
  | 'uploading_cover'
  | 'done'
  | 'failed';

export type RevelatorProgress = {
  trackId: string;
  adminId: string;
  phase: RevelatorUploadPhase;
  percent: number;
  label: string;
  error?: string;
};

// Kept intentionally low-retry (unlike a file-transfer job): most Revelator
// upload failures are metadata mismatches that will fail identically on
// retry — only a genuine network hiccup benefits from the one retry.
export const revelatorUploadQueue = new Queue<RevelatorUploadJobData>(
  REVELATOR_UPLOAD_QUEUE_NAME,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 15_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 2000 },
    },
  },
);
