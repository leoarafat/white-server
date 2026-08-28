import { Router, Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import config from '../../../config';
import { smartLinkService } from './smart-link.service';
import { DSP_WHITELIST } from './smart-link.validations';
import { renderNotFoundPage, renderPublicLinkPage } from './smart-link.templates';

const router = Router();

// Smart Link pages are meant to be shared under the artist-facing landing
// domain (proxied there via the landing app's Next.js rewrite), not this
// API's own domain — SMART_LINK_PUBLIC_DOMAIN lets that branding be correct
// even though the request Next.js forwards here still carries its own Host
// header. Falls back to the actual request host so local dev needs no env
// var to work.
const getPublicBaseUrl = (req: Request) => {
  if (config.smart_link_public_domain) {
    return config.smart_link_public_domain.replace(/\/+$/, '');
  }
  return `${req.protocol}://${req.get('host')}`;
};

const PLATFORM_LABELS: Record<string, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube_music: 'YouTube Music',
  jiosaavn: 'JioSaavn',
  gaana: 'Gaana',
  amazon_music: 'Amazon Music',
  wynk: 'Wynk Music',
  hungama: 'Hungama',
};

const viewPublicLink = catchAsync(async (req: Request, res: Response) => {
  const link = await smartLinkService.getPublicLinkBySlug(req.params.slug);
  if (!link) {
    res.status(404).send(renderNotFoundPage());
    return;
  }

  const baseUrl = getPublicBaseUrl(req);
  const html = renderPublicLinkPage({
    title: link.title,
    artworkUrl: link.artworkUrl,
    pageUrl: `${baseUrl}/l/${link.slug}`,
    dspLinks: link.dspLinks.map(d => ({
      label: PLATFORM_LABELS[d.platform] || d.platform,
      href: `${baseUrl}/l/${link.slug}/out/${d.platform}`,
    })),
  });
  res.set('Cache-Control', 'public, max-age=60');
  res.send(html);
});

const redirectToDsp = catchAsync(async (req: Request, res: Response) => {
  const { slug, platform } = req.params;
  if (!DSP_WHITELIST[platform]) {
    res.status(404).send(renderNotFoundPage());
    return;
  }

  const dspUrl = await smartLinkService.registerClick(slug, platform, {
    userAgent: req.get('user-agent'),
    referrer: req.get('referer'),
  });
  res.redirect(302, dspUrl);
});

router.get('/:slug', viewPublicLink);
router.get('/:slug/out/:platform', redirectToDsp);

export const SmartLinkPublicRoutes = router;
