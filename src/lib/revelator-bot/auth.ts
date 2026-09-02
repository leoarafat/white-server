import { Page } from 'puppeteer';
import config from '../../config';
import { logger } from '../../shared/logger';
import { getDecryptedCredentials } from '../../app/modules/revelator/revelator.settings.service';
import { delay } from './fieldHelpers';

// Recon: backstage.<label domain> redirects to auth.<label domain> when not
// logged in, with textbox[placeholder="Email"], textbox[placeholder="Password"]
// (type=password), button "Submit". The persistent Chrome profile means this
// normally only runs once — afterwards the session cookie carries over.
export async function ensureLoggedIn(page: Page): Promise<void> {
  await page.goto(config.revelator.baseUrl, {
    waitUntil: 'networkidle2',
    timeout: 45_000,
  });

  const emailField = await page.$('input[placeholder="Email"]');
  if (!emailField) {
    // Already authenticated via the persistent session.
    return;
  }

  logger.info('Revelator session expired/absent — logging in');
  const credentials = await getDecryptedCredentials();
  if (!credentials) {
    throw new Error(
      'No Revelator credentials configured — set them on the admin Revelator Settings page first',
    );
  }

  await emailField.click({ clickCount: 3 });
  await emailField.type(credentials.username, { delay: 15 });

  const passwordField = await page.$('input[placeholder="Password"]');
  if (!passwordField) {
    throw new Error('Revelator login page: password field not found');
  }
  await passwordField.click({ clickCount: 3 });
  await passwordField.type(credentials.password, { delay: 15 });

  const submitted = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Submit',
    );
    if (btn) {
      (btn as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (!submitted) {
    throw new Error('Revelator login page: Submit button not found');
  }

  await page
    .waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 })
    .catch(() => undefined);
  await delay(1500);

  const stillOnLogin = await page.$('input[placeholder="Password"]');
  if (stillOnLogin) {
    throw new Error(
      'Revelator login failed — check the credentials on the admin Revelator Settings page',
    );
  }
  logger.info('Revelator login successful');
}
