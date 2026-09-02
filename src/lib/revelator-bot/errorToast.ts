import { Page } from 'puppeteer';
import { delay } from './fieldHelpers';

// After clicking "Create", Revelator shows a red toast (heading "Error" +
// a message, e.g. "Please fill all mandatory fields") when something is
// missing/invalid — see recon notes in the plan doc. We poll briefly for it
// rather than trusting a fixed wait, since a successful create just closes
// the dialog with no toast at all.
export async function captureErrorToast(
  page: Page,
  timeoutMs = 6000,
): Promise<string | null> {
  const pollEvery = 300;
  let waited = 0;
  while (waited < timeoutMs) {
    const message = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('*')).filter(
        el =>
          el.children.length === 0 && el.textContent?.trim() === 'Error',
      );
      for (const h of headings) {
        // The message is the next text-bearing sibling/nearby node.
        const container = h.closest('div');
        const text = container?.textContent?.trim();
        if (text && text !== 'Error') return text.replace(/^Error/, '').trim();
      }
      return null;
    });
    if (message) return message;
    await delay(pollEvery);
    waited += pollEvery;
  }
  return null;
}

// True once the "Create Digital Release"/"Create Audio Asset" dialog itself
// is gone from the DOM (the success path — no toast, dialog closes).
export async function waitForDialogClosed(
  page: Page,
  dialogHeading: string,
  timeoutMs = 15000,
): Promise<boolean> {
  try {
    await page.waitForFunction(
      (heading: string) => {
        const el = Array.from(document.querySelectorAll('h1,h2')).find(
          h => h.textContent?.trim() === heading,
        );
        return !el;
      },
      { timeout: timeoutMs },
      dialogHeading,
    );
    return true;
  } catch {
    return false;
  }
}
