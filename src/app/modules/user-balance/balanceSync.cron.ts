// cron/balanceSync.cron.ts
import cron from 'node-cron';
import { syncAllUsersBalance } from './balanceSync.service';

// প্রতিদিন রাত ২টায় run হবে
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Running nightly balance sync...');
  await syncAllUsersBalance();
});
