import { Router } from 'express';
import { uploadFile } from '../../middlewares/fileUpload';
import { StaticsController } from './statics.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { requirePermission } from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { StaticsZodSchema } from './statics.validations';

const router = Router();
//!Analytics management
router.get(
  '/files',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StaticsController.getFiles,
);
router.get(
  '/all-isrcs',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StaticsController.getAllIsrcs,
);
router.get(
  '/analytics',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.generateAnalytics,
);
router.get(
  '/latest-period',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  // NOTE: feeds both /analytics and /financial-analytics pages (non-sensitive
  // period metadata only) — intentionally left ungated, see task report.
  StaticsController.getLatestReportPeriod,
);
router.get(
  '/vevo-analytics',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/vevo-analytics'),
  StaticsController.vevoAnalytics,
);
router.get(
  '/top-artist-label-analytics',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/vevo-analytics'),
  StaticsController.topArtistAndLabelAnalytics,
);
router.get(
  '/all-labels',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/vevo-analytics'),
  StaticsController.allLabels,
);
router.get(
  '/analytics-by-tracks',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.generateAnalyticsByTractile,
);
router.get(
  '/analytics-by-label',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.generateStreamsAnalyticsByLabel,
);
router.post(
  '/add',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  validateRequest(StaticsZodSchema.insertIntoDBSchema),
  StaticsController.insertIntoDB,
);
router.post(
  '/stream-file',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile,
  StaticsController.UploadStreamFile,
);

// These four are baseline "how much money do I have" figures — they feed
// the ALWAYS-VISIBLE Overview page (RevenueOverviewCards) plus the Payment
// & Operation and Financial Reports pages, which each have their OWN,
// DIFFERENT permission key. Gating them behind a single specific permission
// (they were previously all behind '/analytics') meant a sub-user granted
// e.g. only "Payment & Operation" still got 403'd and silently saw $0.00 on
// their own Payment & Operation page. Left deliberately ungated — same
// reasoning as /latest-period and /test-files above — so whichever page a
// sub-user DOES have access to always shows correct figures.
router.get(
  '/my-balance',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  StaticsController.myCurrentMonthBalance,
);
router.get(
  '/total-songs',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  StaticsController.totalCounts,
);
router.get(
  '/my-allTime-balance',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  StaticsController.getAllTimeTotalRevenue,
);
router.get(
  '/my-full-month-balance',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  StaticsController.myFullMonthBalance,
);

router.get(
  '/my-files',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  StaticsController.getMyDataFromFiles,
);
router.get(
  '/all-songs',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/my-uploads'),
  StaticsController.allSongs,
);
router.get(
  '/test-files',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  // NOTE: unused debug/test endpoint (StaticsService.testFile just dumps all
  // Statics docs) — not tied to any sidebar page, left ungated, see report.
  StaticsController.testFile,
);

router.get(
  '/music-growth',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/analytics'),
  StaticsController.getMusicGrowthData,
);
router.get(
  '/artist-label-growth',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/analytics'),
  StaticsController.getArtistAndLabelGrowthData,
);
router.get(
  '/financial-analytics',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/financial-analytics'),
  StaticsController.generateFinancialAnalytics,
);
// Master-only (Phase 3 of the sub-user permission system) — not part of the
// sub-user permission catalog, same as /master-review.
router.get(
  '/sub-user-revenue-report',
  auth(ENUM_USER_ROLE.USER),
  StaticsController.getSubUserRevenueReport,
);
router.get(
  '/financial-analytics-country',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/financial-analytics'),
  StaticsController.generateFinancialRevenueAnalyticsByCountry,
);
router.get(
  '/financial-by-store',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/financial-analytics'),
  StaticsController.generateFinancialRevenueAnalytics,
);
router.get(
  '/revenue-by-title',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.revenueByTitle,
);
router.get(
  '/revenue-by-country',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.revenueByCountry,
);
router.get(
  '/revenue-by-platform',
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER),
  requirePermission('/analytics'),
  StaticsController.revenueByPlatform,
);
router.get(
  '/latest-labels',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/analytics'),
  StaticsController.lastSixApprovedLabel,
);
router.get(
  '/latest-artists',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  requirePermission('/analytics'),
  StaticsController.latestArtists,
);
router.delete(
  '/delete-files/:id',
  // SECURITY: this deletes/reverses a whole admin-uploaded revenue report
  // (affecting every user's balance derived from it) — it must never be
  // reachable by a plain user/sub-user account. Only the admin app calls
  // this (confirmed via grep); USER/SUB_USER were previously included here
  // with no ownership check, letting any logged-in user/sub-user corrupt
  // platform-wide revenue data.
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  StaticsController.deleteFiles,
);

export const StaticsRoutes = router;
