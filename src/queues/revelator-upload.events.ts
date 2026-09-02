import { QueueEvents } from 'bullmq';
import { redisConnection } from './redis.connection';
import { REVELATOR_UPLOAD_QUEUE_NAME, RevelatorProgress } from './revelator-upload.queue';
import { emitToAdmin } from '../socket/socket';
import { logger } from '../shared/logger';

// Bridges BullMQ's own Redis-pub/sub-backed progress stream (no custom
// plumbing needed — job.updateProgress() in the worker process is enough)
// to a real-time socket.io push in THIS process (the main API server, which
// holds the connected admin sockets — the worker process doesn't have any).
let started = false;

export function startRevelatorUploadEventsBridge(): void {
  if (started) return;
  started = true;

  const queueEvents = new QueueEvents(REVELATOR_UPLOAD_QUEUE_NAME, {
    connection: redisConnection,
  });

  queueEvents.on('progress', ({ jobId, data }) => {
    const progress = data as unknown as RevelatorProgress;
    if (!progress?.trackId || !progress?.adminId) return;
    try {
      emitToAdmin(progress.adminId, 'revelator:progress', progress);
    } catch (err) {
      logger.error(`revelator:progress bridge error for job ${jobId}`, err);
    }
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.warn(`Revelator upload job ${jobId} failed: ${failedReason}`);
  });

  logger.info('✅ Revelator upload QueueEvents → socket bridge started');
}
