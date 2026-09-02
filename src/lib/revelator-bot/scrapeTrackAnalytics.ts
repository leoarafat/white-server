import { Page } from 'puppeteer';
import { RevelatorAnalyticsPeriod } from '../../app/modules/revelator/revelator-analytics.interface';
import { delay } from './fieldHelpers';
import { openCatalogSection } from './uploadAudioAsset';

const GRANULARITY_LABEL: Record<RevelatorAnalyticsPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

async function openHamburger(page: Page): Promise<void> {
  const hamburger = await page.$('header button, nav button, button');
  if (hamburger) {
    await hamburger.click();
    await delay(400);
  }
}

async function clickTile(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text: string) => {
    const tiles = Array.from(document.querySelectorAll('button, a, div'));
    const match = tiles.find(
      el => el.textContent?.trim() === text && el.children.length === 0,
    );
    if (match) {
      const clickable = match.closest('button, a') || (match as HTMLElement);
      (clickable as HTMLElement).click();
      return true;
    }
    return false;
  }, label);
}

async function setGranularity(
  page: Page,
  period: RevelatorAnalyticsPeriod,
): Promise<void> {
  const label = GRANULARITY_LABEL[period];
  const clicked = await page.evaluate((text: string) => {
    // The granularity dropdown trigger currently shows one of
    // Daily/Weekly/Monthly/Quarterly as its own label.
    const trigger = Array.from(
      document.querySelectorAll('button, [role="button"]'),
    ).find(el =>
      ['Daily', 'Weekly', 'Monthly', 'Quarterly'].includes(
        el.textContent?.trim() || '',
      ),
    );
    if (trigger) {
      (trigger as HTMLElement).click();
      return true;
    }
    return false;
  }, label);
  if (!clicked) return;
  await delay(300);
  await page.evaluate((text: string) => {
    const option = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent?.trim() === text && el.children.length === 0,
    );
    if (option) (option as HTMLElement).click();
  }, label);
  await delay(500);
}

/*
 * Best-effort scrape of one track's numbers for one period granularity.
 * Route: Consumption → "See More" (Advanced Analytics) → Track tab →
 * Filters → Tracks search (exact title) for streams; Revenue page's "Top
 * Tracks" table (matched by title) for $. This is the part of the plan
 * flagged as needing a short live-calibration pass — the exact filter/search
 * interaction inside "Advanced Analytics" wasn't exercised end-to-end during
 * recon (kept the reconnaissance session read-only against a live account).
 */
export async function scrapeTrackAnalytics(
  page: Page,
  baseUrl: string,
  trackTitle: string,
  period: RevelatorAnalyticsPeriod,
): Promise<{ streams: number; revenueGross: number; currency: string }> {
  // --- Streams (Consumption) ---
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 45_000 });
  await delay(600);
  const seeMoreClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button, a')).find(
      el => el.textContent?.trim().includes('See More'),
    );
    if (btn) {
      (btn as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (seeMoreClicked) await delay(800);

  await clickTile(page, 'Track');
  await delay(500);
  await setGranularity(page, period);

  // Filter to the exact track via the Filters → Tracks search box.
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el =>
      el.textContent?.includes('Tracks'),
    );
    if (btn) (btn as HTMLElement).click();
  });
  await delay(400);
  const searchInput = await page.$('input[placeholder="Search"]');
  if (searchInput) {
    await searchInput.click({ clickCount: 3 });
    await searchInput.type(trackTitle, { delay: 15 });
  }
  await delay(600);

  const streams = await page.evaluate((title: string) => {
    const rows = Array.from(document.querySelectorAll('table tbody tr, tbody > *'));
    for (const row of rows) {
      if (row.textContent?.includes(title)) {
        const numMatch = row.textContent.match(/[\d,]+/);
        return numMatch ? Number(numMatch[0].replace(/,/g, '')) : 0;
      }
    }
    return 0;
  }, trackTitle);

  // --- Revenue (Top Tracks table) ---
  await openHamburger(page);
  await delay(300);
  // Switch the section pill from Consumption to Revenue.
  const pill = await page.$('button, [role="button"]');
  if (pill) {
    await pill.click();
    await delay(300);
  }
  await clickTile(page, 'Revenue');
  await delay(800);

  const revenue = await page.evaluate((title: string) => {
    const rows = Array.from(document.querySelectorAll('*')).filter(
      el => el.children.length === 0 && el.textContent?.trim() === title,
    );
    for (const cell of rows) {
      const row = cell.closest('tr') || cell.parentElement?.parentElement;
      const text = row?.textContent || '';
      const dollarMatch = text.match(/\$[\d,.]+/);
      if (dollarMatch) {
        return Number(dollarMatch[0].replace(/[$,]/g, ''));
      }
    }
    return 0;
  }, trackTitle);

  return { streams, revenueGross: revenue, currency: 'USD' };
}
