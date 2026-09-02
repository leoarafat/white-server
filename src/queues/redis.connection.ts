import IORedis from 'ioredis';
import config from '../config';

// Same shape as dream-records' proven queues/redis.connection.ts — a single
// shared connection imported by every queue/worker/events file in this
// process. `maxRetriesPerRequest: null` is required by BullMQ for the
// blocking connections a Worker uses.
export const redisConnection = new IORedis({
  host: config.redis.host || '127.0.0.1',
  port: Number(config.redis.port || 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
