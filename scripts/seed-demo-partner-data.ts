/* eslint-disable no-console */
// One-time demo seeder — creates real, persistent Partner API data across
// every status so it can be browsed live in the admin UI. Not cleaned up.
import mongoose from 'mongoose';
import config from '../src/config';
import User from '../src/app/modules/user/user.model';
import { PartnerKey } from '../src/app/modules/partnerApi/key/partnerKey.model';
import { generatePartnerKey } from '../src/app/modules/partnerApi/key/partnerKey.utils';
import { createRelease, simulateReleaseTransition } from '../src/app/modules/partnerApi/release/partnerRelease.service';
import { adminUpdateReleaseStatus } from '../src/app/modules/partnerApi/release/partnerRelease.admin.service';
import { createChannel, simulateChannelTransition } from '../src/app/modules/partnerApi/channel/partnerChannel.service';
import { adminUpdateChannelStatus } from '../src/app/modules/partnerApi/channel/partnerChannel.admin.service';
import { catalogVideoService } from '../src/app/modules/catalog-video/catalog-video.service';
import { Video } from '../src/app/modules/videos/videos.model';
import { Channel } from '../src/app/modules/vevo-channel/vevo-channel.model';
import { PartnerAuthContext } from '../src/app/middlewares/partnerAuth';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  await mongoose.connect(config.database_url as string);
  const user = await User.findOne({ role: 'user' }).sort({ createdAt: -1 });
  if (!user) throw new Error('No user found to seed against');
  const userId = String(user._id);

  const liveKey = generatePartnerKey('live');
  const livePK = await PartnerKey.create({
    user: userId, label: 'Demo Live Integration', environment: 'live',
    scopes: ['release:write', 'release:read', 'channel:write', 'channel:read'],
    keyHash: liveKey.hash, keyPrefix: liveKey.prefix,
  });
  const testKey = generatePartnerKey('test');
  await PartnerKey.create({
    user: userId, label: 'Demo Test Integration', environment: 'test',
    scopes: ['release:write', 'release:read', 'channel:write', 'channel:read'],
    keyHash: testKey.hash, keyPrefix: testKey.prefix,
  });
  const webhookKey = generatePartnerKey('live');
  await PartnerKey.create({
    user: userId, label: 'Demo Webhook Key', environment: 'live',
    scopes: ['webhook:manage'],
    keyHash: webhookKey.hash, keyPrefix: webhookKey.prefix,
  });

  const liveCtx: PartnerAuthContext = {
    keyId: String(livePK._id), userId, environment: 'live',
    scopes: ['release:write', 'release:read', 'channel:write', 'channel:read'], ipAllowlist: [],
  };

  const mkRelease = (title: string, extra: Record<string, unknown> = {}) => ({
    title, primaryArtist: ['Demo Artist'], sourceVideoUrl: `https://example.com/${title.replace(/\s+/g, '-')}.mp4`,
    imageUrl: `https://example.com/${title.replace(/\s+/g, '-')}.jpg`, genre: ['Pop'], label: 'Demo Label',
    ...extra,
  } as any);

  // --- Live release still pending intake (admin hasn't acted yet) ---
  const relPending = await createRelease(liveCtx, mkRelease('Demo Pending Release'));
  console.log('pending release:', relPending.data.id);

  // --- Live release sent to catalog, left in Pending Video ---
  const relInCatalog = await createRelease(liveCtx, mkRelease('Demo In Catalog Release'));
  await adminUpdateReleaseStatus(String((relInCatalog.data as any).id), { status: 'approved' });

  // --- Live release moved to In Review ---
  const relInReview = await createRelease(liveCtx, mkRelease('Demo In Review Release'));
  const inReviewResult = await adminUpdateReleaseStatus(String((relInReview.data as any).id), { status: 'approved' });
  await wait(300);
  const inReviewVideoId = (await mongoose.model('PartnerRelease').findById((relInReview.data as any).id).lean() as any)?.catalogVideoId;
  await catalogVideoService.moveToInReview({ params: { id: String(inReviewVideoId) }, user: { userId: (await mongoose.model('Admin').findOne().lean() as any)?._id } } as any);
  console.log('in_review release synced:', inReviewResult.id);

  // --- Live release sent back for correction (needs_fix) ---
  const relNeedsFix = await createRelease(liveCtx, mkRelease('Demo Needs Fix Release'));
  await adminUpdateReleaseStatus(String((relNeedsFix.data as any).id), { status: 'approved' });
  await wait(300);
  const needsFixVideoId = (await mongoose.model('PartnerRelease').findById((relNeedsFix.data as any).id).lean() as any)?.catalogVideoId;
  await catalogVideoService.correctionContent({
    params: { id: String(needsFixVideoId) },
    body: { user: userId, message: 'Please fix the cover art aspect ratio and resend.', title: 'Demo Needs Fix Release' },
    user: { userId: (await mongoose.model('Admin').findOne().lean() as any)?._id },
  } as any);
  await wait(300);

  // --- Live release approved (still in catalog review, admin approved it there) ---
  const relApproved = await createRelease(liveCtx, mkRelease('Demo Approved Release'));
  await adminUpdateReleaseStatus(String((relApproved.data as any).id), { status: 'approved' });
  await wait(300);
  const approvedVideoId = (await mongoose.model('PartnerRelease').findById((relApproved.data as any).id).lean() as any)?.catalogVideoId;
  await Video.findOneAndUpdate({ _id: approvedVideoId }, { isApproved: 'approved', isCorrection: false, videoStatus: 'none' }, { new: true });
  await wait(300);

  // --- Live release delivered (live) ---
  const relDelivered = await createRelease(liveCtx, mkRelease('Demo Delivered Release'));
  await adminUpdateReleaseStatus(String((relDelivered.data as any).id), { status: 'approved' });
  await wait(300);
  const deliveredVideoId = (await mongoose.model('PartnerRelease').findById((relDelivered.data as any).id).lean() as any)?.catalogVideoId;
  await Video.findOneAndUpdate({ _id: deliveredVideoId }, { isApproved: 'approved', isCorrection: false, videoStatus: 'none' }, { new: true });
  await wait(300);
  await Video.findOneAndUpdate({ _id: deliveredVideoId }, { videoStatus: 'distribute', youtubeLink: 'https://youtube.com/watch?v=demo-delivered' }, { new: true });
  await wait(300);

  // --- Live release taken down ---
  const relTakenDown = await createRelease(liveCtx, mkRelease('Demo Taken Down Release'));
  await adminUpdateReleaseStatus(String((relTakenDown.data as any).id), { status: 'approved' });
  await wait(300);
  const takenDownVideoId = (await mongoose.model('PartnerRelease').findById((relTakenDown.data as any).id).lean() as any)?.catalogVideoId;
  await Video.findOneAndUpdate({ _id: takenDownVideoId }, { isApproved: 'approved', isCorrection: false, videoStatus: 'none' }, { new: true });
  await wait(300);
  await Video.findOneAndUpdate({ _id: takenDownVideoId }, { videoStatus: 'distribute', youtubeLink: 'https://youtube.com/watch?v=demo-takendown' }, { new: true });
  await wait(300);
  await Video.findOneAndUpdate({ _id: takenDownVideoId }, { videoStatus: 'take-down' }, { new: true });
  await wait(300);

  // --- Live release rejected at intake (never touched the catalog) ---
  const relRejected = await createRelease(liveCtx, mkRelease('Demo Rejected Release'));
  await adminUpdateReleaseStatus(String((relRejected.data as any).id), {
    status: 'rejected', reason: 'Duplicate submission of an existing catalog title.',
  });

  // --- Test release, walked through every status via /simulate ---
  const testCtx: PartnerAuthContext = { ...liveCtx, environment: 'test' };
  const relTest = await createRelease(testCtx, mkRelease('Demo Test Release'));
  await simulateReleaseTransition(testCtx, String((relTest.data as any).id), { status: 'approved' });

  console.log('\n--- Channels ---');
  // --- Live channel pending intake ---
  await createChannel(liveCtx, { channelName: 'DemoPendingVEVO', artistName: 'Demo Artist' });

  // --- Live channel sent to catalog, approved there ---
  const chanApproved = await createChannel(liveCtx, { channelName: 'DemoApprovedVEVO', artistName: 'Demo Artist' });
  await adminUpdateChannelStatus(String((chanApproved as any).id), { status: 'approved' });
  await wait(300);
  const approvedChannelId = (await mongoose.model('PartnerChannel').findById((chanApproved as any).id).lean() as any)?.catalogChannelId;
  await Channel.findOneAndUpdate({ _id: approvedChannelId }, { isApproved: 'approved', youtubeLink: 'https://youtube.com/channel/UCdemoapproved' }, { new: true });
  await wait(300);

  // --- Live channel sent to catalog, rejected there ---
  const chanRejected = await createChannel(liveCtx, { channelName: 'DemoRejectedVEVO', artistName: 'Demo Artist' });
  await adminUpdateChannelStatus(String((chanRejected as any).id), { status: 'approved' });
  await wait(300);
  const rejectedChannelId = (await mongoose.model('PartnerChannel').findById((chanRejected as any).id).lean() as any)?.catalogChannelId;
  await Channel.findOneAndUpdate({ _id: rejectedChannelId }, { isApproved: 'rejected' }, { new: true });
  await wait(300);

  // --- Test channel, simulated approved ---
  const chanTest = await createChannel(testCtx, { channelName: 'DemoTestVEVO' });
  await simulateChannelTransition(testCtx, String((chanTest as any).id), { status: 'approved' });

  console.log('\nDONE. Seeded:');
  console.log('LIVE_KEY:', liveKey.plaintext);
  console.log('TEST_KEY:', testKey.plaintext);
  console.log('WEBHOOK_KEY:', webhookKey.plaintext);
  process.exit(0);
}

main().catch(e => { console.error('SEED ERROR', e); process.exit(1); });
