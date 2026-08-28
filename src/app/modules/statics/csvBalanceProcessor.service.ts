import mongoose from 'mongoose';
import { Statics } from '../statics/statics-model';

import User from '../user/user.model';
import { SingleTrack } from '../single-track/single.model';
import { Video } from '../videos/videos.model';
import { Album } from '../album/album.model';
import { getUserRevenueRate } from './statics.service';
import { UserBalance } from '../user-balance/UserBalance.model';

type StaticsDocument = {
  filename: string;
  fieldname: string;
  data: any[];
};

// ─── ISRC → UserId map ────────────────────────────────────────────────────────
export const buildIsrcUserMap = async (
  isrcList: string[],
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  if (!isrcList.length) return map;

  const [singles, videos, albums] = await Promise.all([
    SingleTrack.find({ isrc: { $in: isrcList } }, { isrc: 1, user: 1 }).lean(),
    Video.find({ isrc: { $in: isrcList } }, { isrc: 1, user: 1 }).lean(),
    Album.aggregate([
      { $unwind: '$audio' },
      { $match: { 'audio.isrc': { $in: isrcList } } },
      {
        $project: {
          _id: 0,
          isrc: { $trim: { input: '$audio.isrc' } },
          user: 1,
        },
      },
    ]),
  ]);

  for (const s of singles) {
    if (s.isrc && s.user) map.set(s.isrc.trim(), String(s.user));
  }
  for (const v of videos) {
    if (v.isrc && v.user) map.set(v.isrc.trim(), String(v.user));
  }
  for (const a of albums) {
    if (a.isrc && a.user) map.set(a.isrc.trim(), String(a.user));
  }

  return map;
};

// ─── Per-user revenue for one report's rows ────────────────────────────────────
// Shared by insert (credit) AND delete (reverse the same credit) so the two
// can never drift apart — same ISRC→user map, same per-row formula.
//
// Phase 3 (sub-user revenue share): when the ISRC's owner is a sub-user with
// a masterShareRate set, this splits their gross share into what THEY keep
// (net of the cut) and what their MASTER additionally receives — both are
// written into the SAME returned map (owner id AND master id as separate
// keys), so the one loop that $inc's UserBalance in insertCSVWithBalanceUpdate,
// and the one that reverses it in deleteFiles, handle the master's cut for
// free without any changes of their own.
export const computeUserRevenueMap = async (
  rows: any[],
): Promise<Map<string, number>> => {
  const isrcList = [
    ...new Set(
      rows.map((row: any) => row.isrc?.trim()).filter(Boolean) as string[],
    ),
  ];
  const isrcUserMap = await buildIsrcUserMap(isrcList);

  const ownerIds = [...new Set(isrcUserMap.values())];
  const owners = ownerIds.length
    ? await User.find(
        { _id: { $in: ownerIds } },
        { role: 1, revenueRate: 1, masterShareRate: 1, user: 1 },
      ).lean()
    : [];
  const ownerById = new Map(owners.map(o => [String(o._id), o as any]));

  const userRevenueMap = new Map<string, number>();
  const addToUser = (userId: string, amount: number) => {
    if (!amount) return;
    userRevenueMap.set(userId, (userRevenueMap.get(userId) || 0) + amount);
  };

  for (const row of rows) {
    const isrc = row.isrc?.trim();
    if (!isrc) continue;

    const ownerId = isrcUserMap.get(isrc);
    if (!ownerId) continue;
    const owner = ownerById.get(ownerId);
    if (!owner) continue;

    const grossRevenue = parseFloat(
      String(row.revenue ?? row.grossRevenue ?? 0),
    );
    if (isNaN(grossRevenue) || grossRevenue <= 0) continue;

    const ownRateRaw = Number(owner.revenueRate);
    const ownRate = Number.isFinite(ownRateRaw) && ownRateRaw > 0 ? ownRateRaw : 0;
    // Pre-master-cut share — identical to the plain (non-sub-user) formula.
    const ownerGrossShare = grossRevenue * (ownRate / 100);

    if (owner.role === 'sub-user' && owner.user) {
      const masterShareRaw = Number(owner.masterShareRate);
      const masterShare =
        Number.isFinite(masterShareRaw) && masterShareRaw > 0 ? masterShareRaw : 0;
      const cut = ownerGrossShare * (masterShare / 100);
      // Must equal grossRevenue * (getUserRevenueRate-effective-rate / 100) —
      // keep in sync with the effective-rate math in statics.service.ts
      // getUserRevenueRate if this formula ever changes.
      addToUser(ownerId, ownerGrossShare - cut);
      if (cut > 0) addToUser(String(owner.user), cut);
    } else {
      addToUser(ownerId, ownerGrossShare);
    }
  }

  return userRevenueMap;
};

// ─── Main Service ─────────────────────────────────────────────────────────────
export const insertCSVWithBalanceUpdate = async (
  staticDoc: StaticsDocument,
): Promise<void> => {
  // ── Step 1: Duplicate check ──────────────────────────────────────────────
  const alreadyExists = await Statics.findOne({
    filename: staticDoc.filename,
    isProcessed: true,
  }).lean();

  if (alreadyExists) {
    throw new Error(
      `"${staticDoc.filename}" আগেই successfully process হয়েছে। duplicate upload block করা হয়েছে।`,
    );
  }

  // আগের failed attempt cleanup
  await Statics.deleteMany({
    filename: staticDoc.filename,
    isProcessed: false,
  });

  // ── Steps 2-4: ISRC list, ISRC→user mapping, per-user revenue ────────────
  // Same helper the delete/reversal path uses — guarantees the two can
  // never compute a different number for the same report.
  const userRevenueMap = await computeUserRevenueMap(staticDoc.data);

  // ── Step 5: Statics insert (isProcessed: false) ───────────────────────────
  let staticsId: mongoose.Types.ObjectId;

  try {
    const inserted = await Statics.create({
      ...staticDoc,
      isProcessed: false,
    });
    staticsId = inserted._id;
  } catch (err: any) {
    throw new Error(`File save failed: ${err.message}`);
  }

  // ── Step 6: UserBalance update ────────────────────────────────────────────
  if (userRevenueMap.size > 0) {
    const users = await User.find(
      { _id: { $in: Array.from(userRevenueMap.keys()) } },
      { _id: 1, email: 1, name: 1 },
    ).lean();

    const userInfoMap = new Map(users.map(u => [String(u._id), u]));
    const failedUsers: string[] = [];
    const successfulUsers: string[] = [];

    for (const [userId, revenueToAdd] of userRevenueMap.entries()) {
      const userInfo = userInfoMap.get(userId);
      if (!userInfo) continue;

      try {
        const rate = await getUserRevenueRate(userId);
        await UserBalance.findOneAndUpdate(
          { user: new mongoose.Types.ObjectId(userId) },
          {
            $inc: { balance: revenueToAdd },
            $push: { processedStaticIds: staticsId },
            $set: {
              email: (userInfo as any).email,
              name: (userInfo as any).name,
              lastSyncedAt: new Date(),
            },
            $setOnInsert: {
              user: new mongoose.Types.ObjectId(userId),
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear(),
              revenueRate: rate,
            },
          },
          { upsert: true, new: true },
        );
        successfulUsers.push(userId);
      } catch (err: any) {
        failedUsers.push(userId);
      }
    }

    // ── Step 6b: কেউ fail হলে rollback ──────────────────────────────────
    if (failedUsers.length > 0) {
      // Statics delete
      await Statics.findByIdAndDelete(staticsId);

      // Successful user-দের balance undo
      for (const userId of successfulUsers) {
        const revenueToAdd = userRevenueMap.get(userId)!;
        await UserBalance.findOneAndUpdate(
          { user: new mongoose.Types.ObjectId(userId) },
          {
            $inc: { balance: -revenueToAdd },
            $pull: { processedStaticIds: staticsId },
          },
        );
      }

      throw new Error(
        `Balance update failed for ${failedUsers.length} user(s). সব operation rollback করা হয়েছে।`,
      );
    }
  }

  // ── Step 7: সব success → isProcessed: true ───────────────────────────────
  await Statics.findByIdAndUpdate(staticsId, { isProcessed: true });
};
