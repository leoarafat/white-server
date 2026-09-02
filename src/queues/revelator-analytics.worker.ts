import mongoose from 'mongoose';
import cron from 'node-cron';
import config from '../config';
import { logger } from '../shared/logger';
import { SingleTrack } from '../app/modules/single-track/single.model';
import { RevelatorAnalytics } from '../app/modules/revelator/revelator-analytics.model';
import { RevelatorAnalyticsPeriod } from '../app/modules/revelator/revelator-analytics.interface';
import { getBrowser } from '../lib/revelator-bot/browser';
import { ensureLoggedIn } from '../lib/revelator-bot/auth';
import { scrapeTrackAnalytics } from '../lib/revelator-bot/scrapeTrackAnalytics';
import { delay } from '../lib/revelator-bot/fieldHelpers';

const PERIODS: RevelatorAnalyticsPeriod[] = ['daily', 'weekly', 'monthly'];

// Bucket start = today truncated to the period, UTC. Good enough for a
// nightly sweep (each run's numbers overwrite today's bucket via upsert).
function periodStart(period: RevelatorAnalyticsPeriod): Date {
  const now = new Date();
  if (period === 'daily') {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  if (period === 'weekly') {
    const day = now.getUTCDay();
    const diff = (day + 6) % 7; // Monday-start week
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - diff);
    return new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function runSync(): Promise<void> {
  logger.info('🔄 Revelator analytics sync starting');
  const tracks = await SingleTrack.find({ revelatorStatus: 'live' })
    .select('_id user revelatorAssetTitle title')
    .lean();

  if (!tracks.length) {
    logger.info('Revelator analytics sync: no bot-sent tracks yet, skipping');
    return;
  }

  const browser = await getBrowser('analytics');
  const page = await browser.newPage();
  try {
    await ensureLoggedIn(page);

    for (const track of tracks) {
      const title = track.revelatorAssetTitle || track.title;
      for (const period of PERIODS) {
        try {
          const result = await scrapeTrackAnalytics(
            page,
            config.revelator.baseUrl,
            title,
            period,
          );
          await RevelatorAnalytics.findOneAndUpdate(
            { track: track._id, period, periodStart: periodStart(period) },
            {
              track: track._id,
              user: track.user,
              period,
              periodStart: periodStart(period),
              streams: result.streams,
              revenueGross: result.revenueGross,
              currency: result.currency,
              syncedAt: new Date(),
            },
            { upsert: true },
          );
        } catch (err) {
          logger.error(
            `Revelator analytics scrape failed for track ${track._id} (${period})`,
            err,
          );
        }
        // Rate-limit between requests — this runs against a real user
        // session, not a public API.
        await delay(2000);
      }
    }
  } finally {
    await page.close().catch(() => undefined);
  }
  logger.info('✅ Revelator analytics sync complete');
}

async function bootstrap() {
  try {
    await mongoose.connect(config.database_url as string, {
      // @ts-ignore
      enableUtf8Validation: false,
    });
    logger.info('✅ Revelator analytics worker: MongoDB connected');

    cron.schedule(config.revelator.analyticsCron, () => {
      runSync().catch(err =>
        logger.error('Revelator analytics sync crashed', err),
      );
    });
    logger.info(
      `🚀 Revelator analytics worker booted — cron: ${config.revelator.analyticsCron}`,
    );

    if (process.env.REVELATOR_ANALYTICS_RUN_ON_BOOT === 'true') {
      runSync().catch(err =>
        logger.error('Revelator analytics initial sync crashed', err),
      );
    }

    const shutdown = async (signal: string) => {
      logger.info(`Revelator analytics worker shutting down (${signal})...`);
      await mongoose.disconnect();
      process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('❌ Revelator analytics worker bootstrap failed', err);
    process.exit(1);
  }
}

bootstrap();
