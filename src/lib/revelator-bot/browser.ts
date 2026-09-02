import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { logger } from '../../shared/logger';

puppeteer.use(StealthPlugin());

// A persistent Chrome profile dir per bot "identity" (upload vs analytics
// run as separate PM2 processes so they never share a profile/session at
// the same time). Keeps the Revelator login session alive across jobs and
// process restarts, instead of re-authenticating every run.
export function resolveProfileDir(name: string): string {
  const configured =
    process.env[`REVELATOR_${name.toUpperCase()}_PROFILE_DIR`];
  const fallback = path.join(process.cwd(), '.puppeteer-profile', name);
  for (const dir of [configured, fallback].filter(Boolean) as string[]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (err) {
      logger.warn(`Revelator bot profile dir unavailable: ${dir}`, err);
    }
  }
  throw new Error(`No writable puppeteer profile dir for "${name}"`);
}

let browserInstance: Browser | null = null;
let launchingFor: string | null = null;

// One Chromium instance per worker process lifetime — launching per job is
// slow and memory-heavy (see the VEVO-transfer OOM history), so the browser
// is launched once and reused; callers open/close their own `page`.
export async function getBrowser(profileName: string): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  if (launchingFor && launchingFor !== profileName) {
    throw new Error(
      `getBrowser() already launched for profile "${launchingFor}", cannot switch to "${profileName}" in the same process`,
    );
  }
  launchingFor = profileName;
  const userDataDir = resolveProfileDir(profileName);
  logger.info(`Launching Revelator bot browser (profile: ${profileName})`, {
    userDataDir,
  });
  browserInstance = await puppeteer.launch({
    headless: true,
    userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1400,1000',
    ],
    defaultViewport: { width: 1400, height: 1000 },
  });
  browserInstance.on('disconnected', () => {
    logger.warn('Revelator bot browser disconnected');
    browserInstance = null;
  });
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => undefined);
    browserInstance = null;
  }
}
