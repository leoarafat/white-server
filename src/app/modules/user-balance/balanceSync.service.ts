import { Amount, Payment } from '../payments/payments.model';
import { getUserISRCs } from '../statics/isrcs';
import { Statics } from '../statics/statics-model';
import {
  buildRevenueExpr,
  getUserRevenueRate,
  getMasterCutAllTime,
} from '../statics/statics.service';
import User from '../user/user.model';
import { UserBalance } from './UserBalance.model';

const calculateBalanceForUser = async (userId: string) => {
  const [userISRCs, revenueRate] = await Promise.all([
    getUserISRCs(userId),
    getUserRevenueRate(userId),
  ]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const revenueExpr = buildRevenueExpr('$data.revenue', revenueRate);

  const statistics = await Statics.aggregate([
    { $unwind: '$data' },
    { $match: { 'data.isrc': { $in: userISRCs } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: revenueExpr },
      },
    },
  ]);

  const ownShareRevenue =
    statistics.length > 0 ? Number(statistics[0].totalRevenue) || 0 : 0;

  // Phase 3: a master's nightly-synced balance must also include their
  // sub-users' cut — this is a full $set overwrite below, so if this term
  // were left out, it would silently wipe out whatever
  // insertCSVWithBalanceUpdate had incrementally credited the master
  // in-between syncs.
  const masterCut = await getMasterCutAllTime(userId);
  const shareRevenue = ownShareRevenue + masterCut;

  const payments = await Payment.find({ user: userId });
  const previousTotalAmount = payments.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  const balance = shareRevenue - previousTotalAmount;

  // Amount collection-ও sync রাখো (existing logic)
  const isExistAmount = await Amount.findOne({ user: userId });
  if (!isExistAmount) {
    await Amount.create({
      user: userId,
      amount: shareRevenue,
      month: currentMonth,
      year: currentYear,
    });
  } else {
    isExistAmount.amount = balance;
    await isExistAmount.save();
  }

  return { balance, revenueRate, currentMonth, currentYear };
};

export const syncAllUsersBalance = async () => {
  const users = await User.find({}, '_id email name').lean();

  if (!users.length) {
    console.log('[BalanceSync] No users found.');
    return { synced: 0, failed: 0, errors: [] };
  }

  console.log(`[BalanceSync] Starting sync for ${users.length} users...`);

  let synced = 0;
  let failed = 0;
  const errors: { userId: string; error: string }[] = [];

  // Concurrency control — একসাথে ৫টা করে process হবে
  const BATCH_SIZE = 5;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async user => {
        try {
          const { balance, revenueRate, currentMonth, currentYear } =
            await calculateBalanceForUser(String(user._id));

          await UserBalance.findOneAndUpdate(
            { user: user._id },
            {
              $set: {
                user: user._id,
                email: user.email,
                name: user.name,
                balance,
                revenueRate,
                lastSyncedAt: new Date(),
                month: currentMonth,
                year: currentYear,
              },
            },
            { upsert: true, new: true },
          );

          synced++;
        } catch (err: any) {
          failed++;
          errors.push({ userId: String(user._id), error: err.message });
          console.error(
            `[BalanceSync] Failed for user ${user._id}:`,
            err.message,
          );
        }
      }),
    );
  }

  console.log(`[BalanceSync] Done. Synced: ${synced}, Failed: ${failed}`);
  return { synced, failed, errors };
};
