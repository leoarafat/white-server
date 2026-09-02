import { ElementHandle, Page } from 'puppeteer';

/*
 * Revelator's Backstage UI is a React app with no stable class names or
 * test-ids we can rely on (confirmed during recon — see the plan doc). Every
 * lookup here targets the one thing that IS stable: the visible text
 * (placeholder, label, button label) captured during recon. This is the
 * standard resilient-selector strategy, but it still needs a short live
 * calibration pass against the real account before going to production —
 * recon captured the accessibility tree, not raw DOM attributes, so exact
 * radio/select internals may need a small adjustment on first real run.
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

// Finds a form control near a given heading/label text by walking the DOM —
// used for the select/radio-group fields recon captured only by role+label,
// not a stable attribute. Returns the first <input>/<select>/<button> found
// within the same section (until the next heading).
export async function clickNearText(
  page: Page,
  sectionHeading: string,
  controlText: string,
): Promise<boolean> {
  return page.evaluate(
    (heading: string, control: string) => {
      const all = Array.from(document.querySelectorAll('h1,h2,h3,h4,label'));
      const start = all.find(el => el.textContent?.trim() === heading);
      if (!start) return false;
      let node: Element | null = start;
      const sectionEls: Element[] = [];
      // Collect siblings/descendants until the next heading-level element.
      while (node && node.nextElementSibling) {
        node = node.nextElementSibling;
        if (
          node.tagName.match(/^H[1-4]$/) ||
          (node.tagName === 'LABEL' && node !== start)
        ) {
          break;
        }
        sectionEls.push(node, ...Array.from(node.querySelectorAll('*')));
      }
      const target = sectionEls.find(
        el => el.textContent?.trim() === control,
      );
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
      const all = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
      const start = all.find(el => el.textContent?.trim() === heading);
      if (!start) return null;
      let node: Element | null = start;
      while (node && node.nextElementSibling) {
        node = node.nextElementSibling;
        if (node.tagName.match(/^H[1-4]$/)) break;
        const input = node.querySelector('input[type="file"]');
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
