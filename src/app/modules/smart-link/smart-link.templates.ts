// Plain string-builders instead of file-based `.ejs` templates on purpose:
// `tsc` (the project's `build` script) only compiles `.ts` -> `dist`, it does
// not copy other files, so a `templates/*.ejs` read via `__dirname` at
// runtime would 404 once deployed. Keeping the markup inside compiled TS
// avoids that class of bug entirely. Styled to match the dashboard's
// dark + lime identity (bg #0a0e0d, surface #101716, accent #c6f94e).

const escapeHtml = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type PublicLinkView = {
  title: string;
  artworkUrl?: string;
  pageUrl: string;
  dspLinks: { label: string; href: string }[];
};

export const renderPublicLinkPage = (view: PublicLinkView) => {
  const title = escapeHtml(view.title);
  const artworkTag = view.artworkUrl
    ? `<img class="artwork" src="${escapeHtml(view.artworkUrl)}" alt="${title}" />`
    : '';
  const ogImageTag = view.artworkUrl
    ? `<meta property="og:image" content="${escapeHtml(view.artworkUrl)}" />
  <meta name="twitter:image" content="${escapeHtml(view.artworkUrl)}" />`
    : '';
  const dspButtons = view.dspLinks
    .map(
      link =>
        `<a class="dsp-link" href="${escapeHtml(link.href)}"><span>${escapeHtml(link.label)}</span><span class="arrow">&rarr;</span></a>`,
    )
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Listen Now</title>

  <meta property="og:type" content="music.song" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="Listen to ${title} on your favorite platform." />
  ${ogImageTag}
  <meta property="og:url" content="${escapeHtml(view.pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />

  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background:
        radial-gradient(1200px 600px at 50% -10%, rgba(198,249,78,0.10), transparent 60%),
        #0a0e0d;
      color: #f2f6f3;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: #101716;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 18px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.45);
    }
    .artwork {
      width: 224px;
      height: 224px;
      border-radius: 16px;
      object-fit: cover;
      margin: 0 auto 22px;
      display: block;
      background: #1e2a27;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .subtitle { font-size: 13px; color: #9ba8a3; margin: 0 0 26px; }
    .dsp-list { display: flex; flex-direction: column; gap: 10px; }
    .dsp-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 12px;
      background: #17201e;
      border: 1px solid rgba(255,255,255,0.07);
      color: #f2f6f3;
      text-decoration: none;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .dsp-link .arrow { color: #9ba8a3; transition: transform 0.15s ease, color 0.15s ease; }
    .dsp-link:hover {
      background: #c6f94e;
      border-color: #c6f94e;
      color: #0a0e0d;
    }
    .dsp-link:hover .arrow { color: #0a0e0d; transform: translateX(3px); }
    .brand { margin-top: 26px; font-size: 12px; color: #6b7a74; }
    .brand a { color: #c6f94e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    ${artworkTag}
    <p class="title">${title}</p>
    <p class="subtitle">Choose where to listen</p>
    <div class="dsp-list">
      ${dspButtons}
    </div>
    <p class="brand">Powered by <a href="/">ANS Music</a></p>
  </div>
</body>
</html>`;
};

export const renderNotFoundPage = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link not found</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0e0d;
      color: #f2f6f3;
      font-family: "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      text-align: center;
      padding: 24px;
    }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { color: #9ba8a3; font-size: 14px; }
  </style>
</head>
<body>
  <div>
    <h1>This link doesn't exist</h1>
    <p>It may have been removed or the address is incorrect.</p>
  </div>
</body>
</html>`;
