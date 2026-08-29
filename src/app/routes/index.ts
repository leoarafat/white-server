import express from 'express';
import { SystemRoutes } from '../modules/system/system.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { SingleMusicRoutes } from '../modules/single-track/single.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { SubUserRoutes } from '../modules/sub-user/sub-user.routes';
import { AlbumRoutes } from '../modules/album/album.routes';
import { NoteRoutes } from '../modules/note/note.route';
import { bulkRoutes } from '../modules/builk/bulk.routes';
import { paymentRoutes } from '../modules/payments/payments.routes';
import { StoreRoutes } from '../modules/store/sotre.routes';
import { AccountRoutes } from '../modules/account/account.routes';
import { StoredSongsRoutes } from '../modules/stored-songs/sotred-songs.routes';
import { CountrySongsRoutes } from '../modules/stored-country/stored-country.routes';
import { LabelRoutes } from '../modules/label/label.routes';
import { CatalogRoutes } from '../modules/catalogs/catalog.routes';
import { VideoRoutes } from '../modules/videos/videos.routes';
import { MyUploadsRoutes } from '../modules/my-uploads/my-uploads.routes';
import { PrimaryArtistRoutes } from '../modules/primary-artist/primary-artist.routes';
import { FaqRoutes } from '../modules/FAQ/faq.routes';
import { NewsRoutes } from '../modules/news/news.routes';
import { ClientRoutes } from '../modules/clients/clients.routes';
import { StaticsRoutes } from '../modules/statics/statics.routes';
import { ClaimRoutes } from '../modules/claim-release/claim-release.routes';
import { CatalogVideoRoutes } from '../modules/catalog-video/catalog-video.routes';
import { InspectionRoutes } from '../modules/Inspection/inspection.routes';
import { BannerRoutes } from '../modules/banner/banner.routes';
import { RecognizeRoutes } from '../modules/acr/acr.routes';
import { ChannelRoutes } from '../modules/vevo-channel/vevo-channel.routes';
import { MessageRoutes } from '../modules/messages/message.routes';
import { MonetizationRoutes } from '../modules/monitization/monitization.routes';
import { ManageRoutes } from '../modules/privacy-policy/privacy-policy.routes';
import { APIKeyRoutes } from '../modules/ApiKey/ApiKey.routes';
import { noticeRoutes } from '../modules/notice/notice.routes';
import { B2BRoutes } from '../modules/B2BSongs/B2BSongs.routes';
import { ISRCRoutes } from '../modules/isrc/isrc.routes';
import { ResumableUploadRoutes } from '../modules/videos/resumable.routes';
import { TransferOwnershipRoutes } from '../modules/transfer-ownership/transfer-ownership.routes';
import { UserBalanceRoutes } from '../modules/user-balance/balanceSync.route';
import { NotificationRoutes } from '../modules/notifications/notification.routes';
import { ChatRoutes } from '../modules/chat/chat.routes';
import { TicketRoutes } from '../modules/tickets/ticket.routes';
import { SmartLinkRoutes } from '../modules/smart-link/smart-link.routes';
import { SecurityRoutes } from '../modules/security/security.routes';
import { MasterReviewRoutes } from '../modules/master-review/master-review.routes';
import { ReportConverterRoutes } from '../modules/report-converter/report-converter.routes';
import { PartnerApiRoutes } from '../modules/partnerApi/partnerApi.routes';
import { PartnerKeyAdminRoutes } from '../modules/partnerApi/key/partnerKey.admin.routes';
import { PartnerActivityAdminRoutes } from '../modules/partnerApi/activity/partnerActivity.admin.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/claims',
    route: ClaimRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/sub-user',
    route: SubUserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/single-music',
    route: SingleMusicRoutes,
  },
  {
    path: '/album',
    route: AlbumRoutes,
  },
  {
    path: '/video',
    route: VideoRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },

  {
    path: '/note',
    route: NoteRoutes,
  },
  {
    path: '/bulk',
    route: bulkRoutes,
  },
  {
    path: '/primary-artist',
    route: PrimaryArtistRoutes,
  },
  {
    path: '/payment',
    route: paymentRoutes,
  },
  {
    path: '/store',
    route: StoreRoutes,
  },
  {
    path: '/stored-content',
    route: StoredSongsRoutes,
  },
  {
    path: '/stored-country',
    route: CountrySongsRoutes,
  },
  {
    path: '/account',
    route: AccountRoutes,
  },
  {
    path: '/label',
    route: LabelRoutes,
  },
  {
    path: '/catalog-music',
    route: CatalogRoutes,
  },
  {
    path: '/catalog-video',
    route: CatalogVideoRoutes,
  },
  {
    path: '/my-uploads',
    route: MyUploadsRoutes,
  },
  {
    path: '/faq',
    route: FaqRoutes,
  },
  {
    path: '/news',
    route: NewsRoutes,
  },
  {
    path: '/banner',
    route: BannerRoutes,
  },
  {
    path: '/clients',
    route: ClientRoutes,
  },
  {
    path: '/statics',
    route: StaticsRoutes,
  },
  {
    path: '/latest',
    route: InspectionRoutes,
  },
  {
    path: '/recognize',
    route: RecognizeRoutes,
  },

  {
    path: '/channel',
    route: ChannelRoutes,
  },
  {
    path: '/vevo',
    route: MessageRoutes,
  },
  {
    path: '/monetization',
    route: MonetizationRoutes,
  },
  {
    path: '/manage',
    route: ManageRoutes,
  },
  {
    path: '/apikeys',
    route: APIKeyRoutes,
  },
  {
    path: '/notices',
    route: noticeRoutes,
  },
  {
    path: '/b2b-songs',
    route: B2BRoutes,
  },
  {
    path: '/isrc',
    route: ISRCRoutes,
  },
  {
    path: '/resumable-upload',
    route: ResumableUploadRoutes,
  },
  {
    path: '/transfer-ownership',
    route: TransferOwnershipRoutes,
  },
  {
    path: '/system',
    route: SystemRoutes,
  },
  {
    path: '/user-balance',
    route: UserBalanceRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/tickets',
    route: TicketRoutes,
  },
  {
    path: '/smart-link',
    route: SmartLinkRoutes,
  },
  {
    path: '/security',
    route: SecurityRoutes,
  },
  {
    path: '/master-review',
    route: MasterReviewRoutes,
  },
  {
    path: '/report-converter',
    route: ReportConverterRoutes,
  },
  {
    path: '/partner',
    route: PartnerApiRoutes,
  },
  {
    path: '/partner-admin/keys',
    route: PartnerKeyAdminRoutes,
  },
  {
    path: '/partner-admin/activity',
    route: PartnerActivityAdminRoutes,
  },
];
moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
