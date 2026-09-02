import { ElementHandle, Page } from 'puppeteer';

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
// "some options are present" (or even "options or empty-message present")
// resolves immediately against that stale list, before the debounced
// server search for the typed text has even fired. The only reliable
// signal is a *change* from what was showing right before typing — so this
// snapshots the option list first, then waits for it to actually differ
// (or for the empty-message to appear).
async function snapshotOptionList(page: Page): Promise<string> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.p-select-option'))
      .map(el => el.textContent)
      .join('|'),
  );
}

async function waitForSearchSettled(
  page: Page,
  baseline: string,
  timeoutMs = 6000,
): Promise<void> {
  await page
    .waitForFunction(
      (base: string) => {
        if (document.querySelector('.p-select-empty-message')) return true;
        const current = Array.from(
          document.querySelectorAll('.p-select-option'),
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
export async function selectPSelectOption(
  page: Page,
  triggerPlaceholder: string,
  value: string,
  index = 0,
): Promise<PSelectResult> {
  const triggers = await page.$$(
    `[placeholder="${cssEscape(triggerPlaceholder)}"]`,
  );
  const trigger = triggers[index];
  if (!trigger) return { found: false };
  await trigger.click();
  await delay(400);

  const filter = await page.$('.p-select-filter');
  if (filter) {
    const baseline = await snapshotOptionList(page);
    await filter.click({ clickCount: 3 });
    await filter.type(value, { delay: 10 });
    await waitForSearchSettled(page, baseline);
  }

  const emptyMessage = await page.$('.p-select-empty-message');
  if (emptyMessage) {
    await page.keyboard.press('Escape').catch(() => undefined);
    return { found: false };
  }

  const clicked = await page.evaluate((needle: string) => {
    const options = Array.from(document.querySelectorAll('.p-select-option'));
    const match = options.find(el => {
      const text = el.textContent?.trim() || '';
      return text === needle || text.startsWith(needle);
    });
    if (match) {
      (match as HTMLElement).click();
      return true;
    }
    return false;
  }, value);

  if (!clicked) {
    await page.keyboard.press('Escape').catch(() => undefined);
    return { found: false };
  }
  return { found: true };
}

async function clickDialogButtonByText(
  page: Page,
  text: string,
): Promise<boolean> {
  return page.evaluate((needle: string) => {
    const btn = Array.from(
      document.querySelectorAll('.p-dialog button'),
    ).find(b => b.textContent?.trim() === needle) as HTMLButtonElement | undefined;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
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

  const filter = await page.$('.p-select-filter');
  if (filter) {
    const baseline = await snapshotOptionList(page);
    await filter.type(artistName, { delay: 10 });
    await waitForSearchSettled(page, baseline);
  }

  const emptyMessage = await page.$('.p-select-empty-message');
  if (emptyMessage) {
    await clickDialogButtonByText(page, 'Cancel');
    return { found: false };
  }

  const clicked = await page.evaluate((needle: string) => {
    const options = Array.from(document.querySelectorAll('.p-select-option'));
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
    await clickDialogButtonByText(page, 'Cancel');
    return { found: false };
  }
  await delay(500);

  const submitted = await clickDialogButtonByText(page, submitButtonText);
  if (!submitted) return { found: false };
  await delay(500);
  return { found: true };
}
