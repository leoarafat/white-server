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
// Generous by default: "Create" here uploads and processes a full master
// WAV on Revelator's side, which takes far longer than a UI interaction.
// The old 15s budget expired mid-upload on a form that was completely
// valid (confirmed from a screenshot: every field filled, no validation
// errors, Create enabled) and surfaced as the misleading "creation did not
// complete (dialog stayed open)".
// Polls rather than using a single waitForFunction: a successful Create
// makes Revelator navigate away from .../manage/create, which destroys the
// execution context and makes waitForFunction throw — the old version
// caught that and reported failure on what was actually a success. Leaving
// the create URL is itself treated as success, and context-destroyed errors
// mid-poll are ignored rather than fatal.
export async function waitForDialogClosed(
  page: Page,
  dialogHeading: string,
  timeoutMs = 300_000,
): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (!page.url().includes('/manage/create')) return true;
      const stillOpen = await page.evaluate(
        (heading: string) =>
          Array.from(document.querySelectorAll('h1,h2')).some(
            h => h.textContent?.trim() === heading,
          ),
        dialogHeading,
      );
      if (!stillOpen) return true;
    } catch {
      // Execution context destroyed => the page navigated => Create landed.
      return true;
    }
    await delay(1000);
  }
  return false;
}
