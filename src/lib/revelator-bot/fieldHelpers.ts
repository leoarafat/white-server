import fs from 'fs';
import path from 'path';
import { ElementHandle, Page } from 'puppeteer';
import { logger } from '../../shared/logger';

/*
 * Revelator's Backstage UI (this white-label instance, backstage.ptunestudio.com)
 * is an Angular app built on PrimeNG — confirmed via live DOM recon against
 * the real "Create Digital Release" form. Two selector strategies are used
 * here: most fields are targeted by their stable visible text (placeholder,
 * label, button label), same as before. Search/autocomplete fields (Language,
 * Genre, Artist, Label — anything backed by PrimeNG's <p-select>) are handled
 * by selectPSelectOption/addArtistViaDialog below, which target PrimeNG's own
 * stable class names (.p-select-filter, .p-select-option, .p-select-empty-message)
 * rather than guessing at option text placement — this is also how the bot
 * detects a value that doesn't exist in the account's Revelator catalog.
 */

const NAV_TIMEOUT = 30_000;

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Every p-select existence-check fix so far has passed manual browser
// testing (real Chrome, driven interactively) and then still failed the
// exact same way on the next live run through the actual headless
// Puppeteer bot — meaning something differs between that manual testing
// and the bot's real headless execution that hasn't been identified yet.
// Rather than keep guessing blindly, capture hard evidence at the exact
// failure point: a screenshot plus the visible overlay's outerHTML (or a
// note that none was found), written to disk so the next failure can
// actually be inspected instead of re-diagnosed from an error string alone.
async function dumpDebugState(page: Page, label: string): Promise<void> {
  try {
    const dir = path.join(process.cwd(), 'debug-screenshots');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = `${stamp}-${label.replace(/[^a-z0-9]+/gi, '-')}`;
    await page.screenshot({
      path: path.join(dir, `${base}.png`) as `${string}.png`,
      fullPage: true,
    });
    const overlayHtml = await page.evaluate(() => {
      const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
      const visible = overlays.find(el => (el as HTMLElement).offsetParent !== null);
      return {
        overlayCount: overlays.length,
        visibleOverlayHtml: visible ? visible.outerHTML.slice(0, 3000) : null,
        allOverlaysInfo: overlays.map(el => ({
          visible: (el as HTMLElement).offsetParent !== null,
          optionCount: el.querySelectorAll('.p-select-option').length,
          hasEmptyMessage: !!el.querySelector('.p-select-empty-message'),
        })),
      };
    });
    fs.writeFileSync(
      path.join(dir, `${base}.json`),
      JSON.stringify(overlayHtml, null, 2),
    );
    logger.warn(`Revelator bot debug dump saved: ${base}`, overlayHtml.allOverlaysInfo);
  } catch (err) {
    logger.warn('Revelator bot debug dump failed', err);
  }
}

export async function waitForAny(
  page: Page,
  texts: string[],
  timeout = NAV_TIMEOUT,
): Promise<string | null> {
  try {
    const result = await page.waitForFunction(
      (needles: string[]) => {
        const body = document.body.innerText || '';
        return needles.find(t => body.includes(t)) || null;
      },
      { timeout },
      texts,
    );
    return (await result.jsonValue()) as string | null;
  } catch {
    return null;
  }
}

export async function fillByPlaceholder(
  page: Page,
  placeholder: string,
  value: string,
): Promise<boolean> {
  const handle = await page.$(
    `input[placeholder="${cssEscape(placeholder)}"], textarea[placeholder="${cssEscape(placeholder)}"]`,
  );
  if (!handle) return false;
  await handle.click({ clickCount: 3 });
  await handle.type(value, { delay: 10 });
  return true;
}

function cssEscape(s: string): string {
  return s.replace(/["\\]/g, '\\$&');
}

// Finds a form control near a given heading text. Revelator's section
// headings are all <h5> (live-confirmed against the real "Create Audio
// Asset" / "Create Digital Release" forms), but the DOM nesting between a
// heading and its field is NOT consistent — some sections wrap the heading
// and its content as sibling divs under a shared ".grid" container, others
// put the heading and content as direct siblings inside one wrapping div.
// Sibling-walking from the heading element itself breaks on the first
// pattern (confirmed: "Origin", "Properties", "Explicit Content Warning",
// "Lyrics", "Copyright" all failed with the old sibling-walk). The reliable
// approach is DOM *document order*, independent of nesting: collect every
// element between this heading and the next h1-h6 heading, in the order
// querySelectorAll('*') already returns them (depth-first document order).
export async function clickNearText(
  page: Page,
  sectionHeading: string,
  controlText: string,
): Promise<boolean> {
  return page.evaluate(
    (heading: string, control: string) => {
      const allEls = Array.from(document.querySelectorAll('*'));
      const headingEls = allEls.filter(el => /^H[1-6]$/.test(el.tagName));
      const startIdx = headingEls.findIndex(
        el => el.textContent?.trim() === heading,
      );
      if (startIdx === -1) return false;
      const startEl = headingEls[startIdx];
      const endEl = headingEls[startIdx + 1] || null;
      const startPos = allEls.indexOf(startEl);
      const endPos = endEl ? allEls.indexOf(endEl) : allEls.length;
      const sectionEls = allEls.slice(startPos + 1, endPos);
      const target = sectionEls.find(el => el.textContent?.trim() === control);
      if (target) {
        (target as HTMLElement).click();
        return true;
      }
      return false;
    },
    sectionHeading,
    controlText,
  );
}

export async function findFileInputBySection(
  page: Page,
  sectionHeading: string,
): Promise<ElementHandle<HTMLInputElement> | null> {
  const handle = await page.evaluateHandle(
    (heading: string) => {
      // Same document-order approach as clickNearText above.
      const allEls = Array.from(document.querySelectorAll('*'));
      const headingEls = allEls.filter(el => /^H[1-6]$/.test(el.tagName));
      const startIdx = headingEls.findIndex(
        el => el.textContent?.trim() === heading,
      );
      if (startIdx === -1) return null;
      const startEl = headingEls[startIdx];
      const endEl = headingEls[startIdx + 1] || null;
      const startPos = allEls.indexOf(startEl);
      const endPos = endEl ? allEls.indexOf(endEl) : allEls.length;
      const sectionEls = allEls.slice(startPos + 1, endPos);
      for (const el of sectionEls) {
        const input = el.querySelector('input[type="file"]');
        if (input) return input;
      }
      return null;
    },
    sectionHeading,
  );
  const el = handle.asElement();
  return el as ElementHandle<HTMLInputElement> | null;
}

export async function selectDropdownOption(
  page: Page,
  placeholder: string,
  optionText: string,
): Promise<boolean> {
  const trigger = await page.$(
    `[placeholder="${cssEscape(placeholder)}"]`,
  );
  if (!trigger) return false;
  await trigger.click();
  await delay(300);
  const clicked = await page.evaluate((text: string) => {
    const options = Array.from(
      document.querySelectorAll('[role="option"], li, div'),
    );
    const match = options.find(el => el.textContent?.trim() === text);
    if (match) {
      (match as HTMLElement).click();
      return true;
    }
    return false;
  }, optionText);
  return clicked;
}

export type PSelectResult = { found: boolean };

// Revelator's p-select search (Artist/Label especially) hits a live server
// query, not a pre-loaded local list — live-confirmed: a fixed ~600ms wait
// after typing produced a false "does not exist" for an artist ("Adib")
// that genuinely is in the account. Root cause: the dropdown already shows
// an unfiltered option list the instant it opens, so a check for merely
// "some options are present" resolves immediately against that stale list,
// before the debounced server search for the typed text has even fired.
// The only reliable signal is a *change* from what was showing right before
// typing — snapshot the option list first, then wait for it to differ (or
// for the empty-message to appear).
//
// Everything here is also scoped to the currently VISIBLE
// `.p-select-overlay` (offsetParent !== null), not `document` globally and
// not just "last in the DOM" — PrimeNG's CDK overlay container can leave a
// previous field's overlay panel behind after it's closed without removing
// it, so DOM order alone is unreliable (confirmed live: a real send still
// failed with "Genre does not exist" using a last-in-DOM-order pick, right
// after "Select existing assets" and the Main-Primary-Artist dialog had
// each opened their own p-select earlier in the same run — one of those
// stale, closed-but-still-present overlays was being picked over the
// actually-open Genre one). Falls back to the last DOM element only if
// nothing is currently visible (e.g. right as an overlay opens).
//
// The overlay-lookup logic is duplicated inline in every evaluate/
// waitForFunction callback below rather than shared as a JS function value
// passed as an argument — Puppeteer only structured-clones evaluate
// arguments (functions serialize to nothing, which is exactly what broke
// the previous version: "getLastOverlay is not a function" on every real
// run). Only the callback passed as the *first* argument to evaluate/
// waitForFunction gets stringified and reconstructed in-browser; anything
// passed as a later argument must be plain data.
async function snapshotOptionList(page: Page): Promise<string> {
  return page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
    const overlay = overlays.find(el => (el as HTMLElement).offsetParent !== null) || overlays[overlays.length - 1] || null;
    if (!overlay) return '';
    return Array.from(overlay.querySelectorAll('.p-select-option'))
      .map(el => el.textContent)
      .join('|');
  });
}

async function waitForSearchSettled(
  page: Page,
  baseline: string,
  timeoutMs = 6000,
): Promise<void> {
  await page
    .waitForFunction(
      (base: string) => {
        const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
        const overlay = overlays.find(el => (el as HTMLElement).offsetParent !== null) || overlays[overlays.length - 1] || null;
        if (!overlay) return false;
        if (overlay.querySelector('.p-select-empty-message')) return true;
        const current = Array.from(
          overlay.querySelectorAll('.p-select-option'),
        )
          .map(el => el.textContent)
          .join('|');
        return current !== base && current.length > 0;
      },
      { timeout: timeoutMs },
      baseline,
    )
    .catch(() => undefined);
}

async function getScopedElement(
  page: Page,
  selector: string,
): Promise<import('puppeteer').ElementHandle<Element> | null> {
  const handle = await page.evaluateHandle((sel: string) => {
    const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
    const overlay = overlays.find(el => (el as HTMLElement).offsetParent !== null) || overlays[overlays.length - 1] || null;
    return overlay ? overlay.querySelector(sel) : null;
  }, selector);
  return handle.asElement() as import('puppeteer').ElementHandle<Element> | null;
}

// Language/Genre/Artist/Label are all PrimeNG <p-select> — clicking the
// trigger (matched by its `placeholder`) opens an overlay with a
// `.p-select-filter` search box, `.p-select-option` <li> results, and (the
// key bit for existence-checking) a `.p-select-empty-message` <li> reading
// "No results found" when nothing in THIS Revelator account matches. Artist
// and Label options render as "Name<id>" (name and a numeric id concatenated
// in one text node, id styled separately) — hence the startsWith fallback
// below rather than requiring an exact match. `index` picks which trigger
// when more than one element on the page shares the same placeholder (e.g.
// Primary Genre vs Secondary Genre, both "Select genre", in DOM order).
//
// The overlay has been observed closing itself mid-interaction on the real
// headless bot in a way that hasn't reproduced under interactive manual
// testing even after removing the confirmed clickCount:3 cause — most
// likely a layout-shift race right after the preceding step (e.g. the
// Main Primary Artist dialog closing and the page reflowing) lands the
// click somewhere that dismisses the panel. Rather than keep chasing an
// exact cause that resists reproduction, this retries the whole
// open-search-click sequence once on an unexpected 0-overlay outcome
// before concluding "not found".
async function attemptSelectPSelectOption(
  page: Page,
  trigger: import('puppeteer').ElementHandle<Element>,
  value: string,
): Promise<PSelectResult | 'overlay-vanished'> {
  // Scroll into view via JS *before* clicking, deliberately not relying on
  // Puppeteer's click-time auto-scroll — Angular CDK overlays (PrimeNG is
  // built on CDK) commonly close on any scroll of their positioning
  // ancestor, and a scroll landing between the overlay opening and the very
  // next interaction with it (the filter click) is the leading remaining
  // suspect after clickCount:3 and a longer settle both failed to fix a
  // 100%-reproducible closure on the real bot. Getting the trigger fully in
  // view up front means nothing later in this function should need to
  // scroll at all.
  await page.evaluate(
    el => (el as HTMLElement).scrollIntoView({ block: 'center' }),
    trigger,
  );
  await delay(150);
  await trigger.click();
  await delay(400);

  const filter = await getScopedElement(page, '.p-select-filter');
  if (filter) {
    const baseline = await snapshotOptionList(page);
    // NOT a triple-click-to-select-all here (unlike fillByPlaceholder) — the
    // filter is always freshly empty right when the overlay opens, and
    // live-confirmed a clickCount:3 here was closing the overlay outright
    // (three rapid clicks landing as an accidental double-click-equivalent
    // on a PrimeNG element that toggles the panel).
    await filter.click();
    await filter.type(value, { delay: 10 });
    await waitForSearchSettled(page, baseline);
  }

  const emptyMessage = await getScopedElement(page, '.p-select-empty-message');
  if (emptyMessage) {
    return { found: false };
  }

  const result = await page.evaluate((needle: string) => {
    const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
    const overlay = overlays.find(el => (el as HTMLElement).offsetParent !== null) || overlays[overlays.length - 1] || null;
    if (!overlay) return 'no-overlay';
    const options = Array.from(overlay.querySelectorAll('.p-select-option'));
    const match = options.find(el => {
      const text = el.textContent?.trim() || '';
      return text === needle || text.startsWith(needle);
    });
    if (match) {
      (match as HTMLElement).click();
      return 'clicked';
    }
    return 'not-found';
  }, value);

  if (result === 'no-overlay') return 'overlay-vanished';
  return { found: result === 'clicked' };
}

export async function selectPSelectOption(
  page: Page,
  triggerPlaceholder: string,
  value: string,
  index = 0,
): Promise<PSelectResult> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const triggers = await page.$$(
      `[placeholder="${cssEscape(triggerPlaceholder)}"]`,
    );
    const trigger = triggers[index];
    if (!trigger) return { found: false };

    const result = await attemptSelectPSelectOption(page, trigger, value);
    if (result === 'overlay-vanished') {
      await dumpDebugState(
        page,
        `pselect-vanished-attempt${attempt}-${triggerPlaceholder}-${value}`,
      );
      await delay(600); // let any in-progress reflow settle before retrying
      continue;
    }
    if (!result.found) {
      await dumpDebugState(page, `pselect-notfound-${triggerPlaceholder}-${value}`);
      await page.keyboard.press('Escape').catch(() => undefined);
    }
    return result;
  }
  return { found: false };
}

async function clickDialogButtonByText(
  page: Page,
  text: string,
): Promise<boolean> {
  return page.evaluate((needle: string) => {
    // Scope to the TOPMOST dialog's own FOOTER — not `.p-dialog button`
    // globally. The entire "Create Audio Asset" / "Create Digital Release"
    // form is itself a .p-dialog (class re-full-screen-modal), so a global
    // `.p-dialog button` search for "Add Artist" matched the *page's*
    // "Key Artists → + Add Artist" trigger (earlier in the DOM) instead of
    // the Add-Main-Primary-Artist dialog's submit button. That opened a
    // second "Add Key Artist" dialog with a required Role field on top of
    // everything, leaving the primary artist unsubmitted and blocking every
    // later step — which surfaced, very misleadingly, as
    // 'Genre "Arabic" does not exist'. Confirmed from a failure screenshot.
    const dialogs = Array.from(document.querySelectorAll('.p-dialog'));
    const topmost = dialogs[dialogs.length - 1];
    if (!topmost) return false;
    const scopes = [
      topmost.querySelector('.p-dialog-footer'),
      topmost,
    ].filter(Boolean) as Element[];
    for (const scope of scopes) {
      const btn = Array.from(scope.querySelectorAll('button')).find(
        b => b.textContent?.trim() === needle,
      ) as HTMLButtonElement | undefined;
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
    }
    return false;
  }, text);
}

// "Add Main Primary Artist" / "Add Artist" (Key Artists) / "Add Performer" /
// "Add Credit" each open a p-dialog containing one
// `[placeholder="Select Artist"]` p-select — picking an artist there reveals
// an Artist Profiles section (Spotify/Apple linking, left untouched — it's
// optional) and enables the dialog's own submit button, which shares the
// open button's label (e.g. both are "Add Artist" for Main Primary Artist).
export async function addArtistViaDialog(
  page: Page,
  openButtonText: string,
  artistName: string,
  submitButtonText: string,
): Promise<PSelectResult> {
  const opened = await page.evaluate((text: string) => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim() === text,
    );
    if (btn) {
      (btn as HTMLElement).click();
      return true;
    }
    return false;
  }, openButtonText);
  if (!opened) return { found: false };
  await delay(500);

  const trigger = await page.$('.p-dialog [placeholder="Select Artist"]');
  if (!trigger) return { found: false };
  await trigger.click();
  await delay(400);

  const filter = await getScopedElement(page, '.p-select-filter');
  if (filter) {
    const baseline = await snapshotOptionList(page);
    await filter.type(artistName, { delay: 10 });
    await waitForSearchSettled(page, baseline);
  }

  const emptyMessage = await getScopedElement(page, '.p-select-empty-message');
  if (emptyMessage) {
    await dumpDebugState(page, `artist-empty-${artistName}`);
    await clickDialogButtonByText(page, 'Cancel');
    return { found: false };
  }

  const clicked = await page.evaluate((needle: string) => {
    const overlays = Array.from(document.querySelectorAll('.p-select-overlay'));
    const overlay = overlays.find(el => (el as HTMLElement).offsetParent !== null) || overlays[overlays.length - 1] || null;
    if (!overlay) return false;
    const options = Array.from(overlay.querySelectorAll('.p-select-option'));
    const match = options.find(el => {
      const text = el.textContent?.trim() || '';
      return text === needle || text.startsWith(needle);
    });
    if (match) {
      (match as HTMLElement).click();
      return true;
    }
    return false;
  }, artistName);
  if (!clicked) {
    await dumpDebugState(page, `artist-noclick-${artistName}`);
    await clickDialogButtonByText(page, 'Cancel');
    return { found: false };
  }
  await delay(500);

  const submitted = await clickDialogButtonByText(page, submitButtonText);
  if (!submitted) return { found: false };
  // Longer settle than before: the dialog closing reflows the page (an
  // artist chip appears, revealing/shifting whatever comes after), and the
  // very next p-select opened right after this (Genre) has been observed
  // closing itself immediately — plausibly a layout-shift race with this
  // reflow. Give it more room before the caller touches anything else.
  await delay(1200);
  return { found: true };
}
