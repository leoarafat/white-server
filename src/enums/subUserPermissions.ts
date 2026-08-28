// Canonical sub-user permission keys. Each key is the exact route path of a
// left-sidebar menu item in `user/src/layout/Dasboard/Dashboard.tsx` — the
// permission modal must show exactly these options and nothing else, so the
// frontend catalog (`user/src/components/SubUser/permission.ts`) is generated
// from the same list of paths/titles. `/` (Overview) is intentionally absent:
// it's the sub-user's landing page and is always visible once approved.
export const SUB_USER_PERMISSION_KEYS = [
  '/single',
  '/release-video',
  '/my-uploads',
  '/smart-links',
  '/artist-management',
  '/analytics',
  '/vevo-analytics',
  '/financial-operations',
  '/financial-reports',
  '/financial-analytics',
  '/add-account',
  '/my-account',
  '/monetization',
  '/artist-channel-request',
  '/tikTok-claim-request',
  '/facebook-whiteList-request',
  '/facebook-claim-request',
  '/whiteList-request',
  '/youtube-claim-request',
  '/youtube-manual-claim',
  '/profile',
  '/change-password',
  '/security',
  '/news',
  '/support',
  '/help',
] as const;

export type SubUserPermissionKey = (typeof SUB_USER_PERMISSION_KEYS)[number];

export const isSubUserPermissionKey = (
  value: string,
): value is SubUserPermissionKey =>
  (SUB_USER_PERMISSION_KEYS as readonly string[]).includes(value);
