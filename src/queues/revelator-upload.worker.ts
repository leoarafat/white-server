import mongoose from 'mongoose';
import { Worker, Job, UnrecoverableError } from 'bullmq';
import config from '../config';
import { logger } from '../shared/logger';
import { redisConnection } from './redis.connection';
import {
  REVELATOR_UPLOAD_QUEUE_NAME,
  RevelatorUploadJobData,
  RevelatorProgress,
} from './revelator-upload.queue';
import { SingleTrack } from '../app/modules/single-track/single.model';
import { getBrowser } from '../lib/revelator-bot/browser';
import { ensureLoggedIn } from '../lib/revelator-bot/auth';
import {
  mapAudioAssetForm,
  mapReleaseForm,
} from '../lib/revelator-bot/mapTrackToRevelatorForm';
import { uploadAudioAsset } from '../lib/revelator-bot/uploadAudioAsset';
import { uploadCoverAndRelease } from '../lib/revelator-bot/uploadCoverAndRelease';
import {
  downloadToTempFile,
  cleanupTempFile,
} from '../lib/revelator-bot/downloadToTempFile';

const concurrency = 1; // one shared browser/Revelator session — must stay 1

async function processJob(
  job: Job<RevelatorUploadJobData>,
): Promise<{ status: 'live' }> {
  const { trackId, adminId } = job.data;
  const report = (phase: RevelatorProgress['phase'], percent: number, label: string, error?: string) =>
    job.updateProgress({ trackId, adminId, phase, percent, label, error } as RevelatorProgress);

  const track = await SingleTrack.findById(trackId);
  if (!track) {
    throw new UnrecoverableError(`Track ${trackId} not found`);
  }

  await SingleTrack.findByIdAndUpdate(trackId, {
    revelatorStatus: 'processing',
    revelatorJobId: String(job.id),
    revelatorError: '',
  });

  await report('queued', 5, 'Job started');

  let audioTempPath: string | null = null;
  let coverTempPath: string | null = null;

  try {
    const browser = await getBrowser('upload');
    const page = await browser.newPage();

    try {
      await report('logging_in', 10, 'Logging in to Revelator');
      await ensureLoggedIn(page);

      await report('downloading', 20, 'Downloading audio file');
      audioTempPath = await downloadToTempFile(
        track.audio,
        '.wav',
        'REVELATOR_UPLOAD_TEMP_DIR',
      );
      if (track.image) {
        coverTempPath = await downloadToTempFile(
          track.image,
          '.jpg',
          'REVELATOR_UPLOAD_TEMP_DIR',
        );
      }

      await report('uploading_asset', 35, 'Creating audio asset on Revelator');
      const audioForm = mapAudioAssetForm(track);
      const assetResult = await uploadAudioAsset(
        page,
        audioTempPath,
        audioForm,
        label => report('uploading_asset', 45, label),
      );
      if (!assetResult.ok) {
        return failStep(assetResult.error);
      }

      await report('creating_release', 60, 'Creating digital release');
      const releaseForm = mapReleaseForm(track);
      const releaseResult = await uploadCoverAndRelease(
        page,
        audioForm.title,
        coverTempPath,
        releaseForm,
        label => report('creating_release', 75, label),
      );
      if (!releaseResult.ok) {
        return failStep(releaseResult.error);
      }

      await report('done', 100, 'Live on Revelator');
      await SingleTrack.findByIdAndUpdate(trackId, {
        revelatorStatus: 'live',
        revelatorError: '',
        sentToRevelatorAt: new Date(),
        revelatorAssetTitle: audioForm.title,
      });
      return { status: 'live' };
    } finally {
      await page.close().catch(() => undefined);
    }
  } finally {
    cleanupTempFile(audioTempPath);
    cleanupTempFile(coverTempPath);
  }

  async function failStep(error: {
    message: string;
    retryable: boolean;
  }): Promise<never> {
    await SingleTrack.findByIdAndUpdate(trackId, {
      revelatorStatus: 'failed',
      revelatorError: error.message,
    });
    await report('failed', 100, 'Failed', error.message);
    if (error.retryable) {
      throw new Error(error.message);
    }
    throw new UnrecoverableError(error.message);
  }
}

async function bootstrapWorker() {
  try {
    await mongoose.connect(config.database_url as string, {
      // @ts-ignore
      enableUtf8Validation: false,
    });
    logger.info('✅ Revelator upload worker: MongoDB connected');
    logger.info('🚀 Revelator upload worker booted and waiting for jobs');

    const worker = new Worker<RevelatorUploadJobData>(
      REVELATOR_UPLOAD_QUEUE_NAME,
      processJob,
      { connection: redisConnection, concurrency },
    );

    worker.on('completed', job => {
      logger.info(`Revelator upload job completed: ${job.id}`);
    });
    worker.on('failed', (job, err) => {
      logger.error(`Revelator upload job failed: ${job?.id} | ${err?.message}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Revelator upload worker shutting down (${signal})...`);
      await worker.close();
      await redisConnection.quit();
      await mongoose.disconnect();
      process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('❌ Revelator upload worker bootstrap failed', err);
    process.exit(1);
  }
}

bootstrapWorker();
