import { Page } from 'puppeteer';
import { RevelatorReleaseForm } from './mapTrackToRevelatorForm';
import {
  clickNearText,
  fillByPlaceholder,
  findFileInputBySection,
  selectDropdownOption,
  delay,
} from './fieldHelpers';
import { captureErrorToast, waitForDialogClosed } from './errorToast';
import { openCatalogSection } from './uploadAudioAsset';
import { RevelatorBotError } from './uploadAudioAsset';

// Drives Catalog → Digital Releases → "New Release" (recon: 3-step dialog —
// Tracks/Assets [select the already-created audio asset by search], Cover
// Artwork, Release Details).
export async function uploadCoverAndRelease(
  page: Page,
  assetTitle: string,
  coverImagePath: string | null,
  form: RevelatorReleaseForm,
  onProgress: (label: string) => void,
): Promise<{ ok: true } | { ok: false; error: RevelatorBotError }> {
  onProgress('Opening Catalog → Digital Releases');
  await openCatalogSection(page, 'Digital Releases');

  onProgress('Opening New Release form');
  const opened = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.trim().includes('New Release'),
    );
    if (btn) {
      (btn as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (!opened) {
    return {
      ok: false,
      error: { message: 'Could not find "New Release" button', retryable: true },
    };
  }
  await delay(800);

  onProgress('Selecting the uploaded audio asset');
  const assetSelected = await selectDropdownOption(
    page,
    'Select existing assets',
    assetTitle,
  );
  if (!assetSelected) {
    return {
      ok: false,
      error: {
        message: `Could not find the just-created audio asset "${assetTitle}" in the assets list`,
        retryable: true,
      },
    };
  }
  await delay(500);

  if (coverImagePath) {
    onProgress('Attaching cover artwork');
    const coverInput = await findFileInputBySection(page, 'Cover Artwork');
    if (coverInput) {
      await coverInput.uploadFile(coverImagePath);
      await delay(1000);
    }
  }

  onProgress('Filling release metadata');
  await selectDropdownOption(page, 'Select language', form.language);
  await fillByPlaceholder(page, 'e.g. My Great Song', form.title);
  if (form.version) {
    await fillByPlaceholder(page, 'e.g. Live, Remix, Remastered', form.version);
  }
  await selectDropdownOption(page, 'Select genre', form.primaryGenre);
  if (form.secondaryGenre) {
    await clickNearText(page, 'Secondary Genre', form.secondaryGenre);
  }

  await clickNearText(
    page,
    'Label',
    form.hasLabel ? 'Yes' : 'No',
  );
  await clickNearText(
    page,
    'Release History',
    form.previouslyReleased ? 'Yes' : 'No',
  );

  if (form.upc) {
    await fillByPlaceholder(page, 'e.g. 000000000000', form.upc);
  }
  if (form.catalogId) {
    await fillByPlaceholder(
      page,
      'e.g. XYGHT or custom code used internally',
      form.catalogId,
    );
  }
  await selectDropdownOption(page, 'Select year', form.copyrightPYear);
  await fillByPlaceholder(page, 'e.g. Label LLC', form.copyrightPText);

  onProgress('Submitting release');
  const clickedCreate = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Create',
    );
    if (btn) {
      (btn as HTMLElement).click();
      return true;
    }
    return false;
  });
  if (!clickedCreate) {
    return {
      ok: false,
      error: { message: 'Could not find the Create button', retryable: true },
    };
  }

  const errorMessage = await captureErrorToast(page);
  if (errorMessage) {
    return { ok: false, error: { message: errorMessage, retryable: false } };
  }

  const closed = await waitForDialogClosed(page, 'Create Digital Release');
  if (!closed) {
    return {
      ok: false,
      error: {
        message: 'Release creation did not complete (dialog stayed open)',
        retryable: true,
      },
    };
  }

  return { ok: true };
}
