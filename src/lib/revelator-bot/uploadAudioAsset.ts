import { Page } from 'puppeteer';
import config from '../../config';
import {
  RevelatorAudioAssetForm,
  ORIGIN_LABELS,
  TRACK_PROPERTY_LABELS,
} from './mapTrackToRevelatorForm';
import {
  clickNearText,
  fillByPlaceholder,
  findFileInputBySection,
  selectDropdownOption,
  selectPSelectOption,
  addArtistViaDialog,
  delay,
} from './fieldHelpers';
import { captureErrorToast, waitForDialogClosed } from './errorToast';

export type RevelatorBotError = { message: string; retryable: boolean };

// A dropdown field (Language, Genre, ...) is account-specific in Revelator —
// it only offers entities that already exist in that Revelator account, so a
// value the release form has but the account doesn't (typo, or genuinely
// missing) can't be picked. Fail immediately with a clear message instead of
// silently skipping the field and letting Revelator's own generic "Please
// fill all mandatory fields" toast surface later with no indication of which
// field or value was the problem.
export function missingOption(
  field: string,
  value: string,
): { ok: false; error: RevelatorBotError } {
  return {
    ok: false,
    error: {
      message: `${field} "${value}" does not exist in this Revelator account. Add it in Revelator first, or fix the value on the release, then resend.`,
      retryable: false,
    },
  };
}

// Drives Catalog → Audio → "New Audio Asset" (recon: 3-step dialog —
// Audio Files, Audio Details, Publishing Details, all in one scrollable
// form). Returns the created asset's title (used later to find it in
// "Select existing assets" and, for analytics, to filter the Track search).
export async function uploadAudioAsset(
  page: Page,
  audioFilePath: string,
  form: RevelatorAudioAssetForm,
  onProgress: (label: string) => void,
): Promise<{ ok: true } | { ok: false; error: RevelatorBotError }> {
  onProgress('Opening Catalog → Audio');
  await openCatalogSection(page, 'Audio');

  onProgress('Opening New Audio Asset form');
  const opened = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.textContent?.trim().includes('New Audio Asset'),
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
      error: { message: 'Could not find "New Audio Asset" button', retryable: true },
    };
  }
  await delay(800);

  onProgress('Attaching audio file');
  const fileInput = await findFileInputBySection(page, 'Stereo File');
  if (!fileInput) {
    return {
      ok: false,
      error: { message: 'Could not find the audio file input', retryable: true },
    };
  }
  await fileInput.uploadFile(audioFilePath);
  await delay(1500);

  if (form.hasIsrc && form.isrc) {
    await clickNearText(page, 'Audio ISRC', 'Yes');
    await delay(300);
    await fillByPlaceholder(page, 'e.g. 000000000000', form.isrc);
  }

  onProgress('Filling audio metadata');
  const languageResult = await selectPSelectOption(page, 'Select language', form.language);
  if (!languageResult.found) {
    return missingOption('Language', form.language);
  }
  await fillByPlaceholder(page, 'e.g. My Great Song', form.title);
  if (form.version) {
    await fillByPlaceholder(page, 'e.g. Live, Remix, Remastered', form.version);
  }

  onProgress('Adding primary artist');
  if (form.primaryArtists.length > 1) {
    return {
      ok: false,
      error: {
        message: `This release has ${form.primaryArtists.length} primary artists — sending releases with more than one primary artist isn't supported by the automation yet.`,
        retryable: false,
      },
    };
  }
  if (form.primaryArtists[0]) {
    const artistResult = await addArtistViaDialog(
      page,
      'Add Main Primary Artist',
      form.primaryArtists[0],
      'Add Artist',
    );
    if (!artistResult.found) {
      return missingOption('Artist', form.primaryArtists[0]);
    }
  }

  const genreResult = await selectPSelectOption(page, 'Select genre', form.primaryGenre, 0);
  if (!genreResult.found) {
    return missingOption('Genre', form.primaryGenre);
  }
  if (form.secondaryGenre) {
    const secondaryGenreResult = await selectPSelectOption(page, 'Select genre', form.secondaryGenre, 1);
    if (!secondaryGenreResult.found) {
      return missingOption('Secondary Genre', form.secondaryGenre);
    }
  }

  const originLabel = ORIGIN_LABELS[form.origin];
  const originOk = await clickNearText(page, 'Origin', originLabel);
  if (!originOk) {
    return {
      ok: false,
      error: { message: `Could not select Origin "${originLabel}"`, retryable: true },
    };
  }

  await selectDropdownOption(page, 'Select year', form.copyrightPYear);
  await fillByPlaceholder(page, 'e.g. Label LLC', form.copyrightPText);

  onProgress('Setting track properties');
  const mappedProperties = form.trackProperties
    .map(p => TRACK_PROPERTY_LABELS[p])
    .filter((label): label is string => Boolean(label));
  if (mappedProperties.length > 0) {
    for (const label of mappedProperties) {
      await clickNearText(page, 'Properties', label);
      await delay(200);
    }
  } else {
    await clickNearText(page, 'Properties', 'None of the above apply');
  }

  if (!form.isExplicit) {
    await clickNearText(page, 'Explicit Content Warning', 'Not Explicit');
  } else {
    await clickNearText(page, 'Explicit Content Warning', 'Explicit Content');
  }

  if (form.hasLyrics) {
    await clickNearText(page, 'Lyrics', 'Contains Lyrics');
    if (form.lyrics) {
      await fillByPlaceholder(page, 'Add your lyrics', form.lyrics);
    }
  } else {
    await clickNearText(page, 'Lyrics', 'Instrumental');
  }

  onProgress('Submitting audio asset');
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

  const closed = await waitForDialogClosed(page, 'Create Audio Asset');
  if (!closed) {
    return {
      ok: false,
      error: {
        message: 'Audio asset creation did not complete (dialog stayed open)',
        retryable: true,
      },
    };
  }

  return { ok: true };
}

// Shared by both flows. The original recon assumed a hamburger menu opening
// a tile-grid switcher — confirmed WRONG against the real live account
// (backstage.ptunestudio.com has a persistent left sidebar instead, no
// hamburger at all) and was the actual cause of every real send failing
// with "Could not navigate to Catalog → Audio" once login started working.
// Both catalog sections have stable, predictable URLs, so navigate directly
// rather than clicking through UI that doesn't match the real app.
const CATALOG_PATHS: Record<'Audio' | 'Digital Releases', string> = {
  Audio: 'en/catalog/audio/list',
  'Digital Releases': 'en/catalog/releases/list',
};

export async function openCatalogSection(
  page: Page,
  sectionLabel: 'Audio' | 'Digital Releases',
): Promise<void> {
  const base = config.revelator.baseUrl.replace(/\/+$/, '');
  await page.goto(`${base}/${CATALOG_PATHS[sectionLabel]}`, {
    waitUntil: 'networkidle2',
    timeout: 30_000,
  });
  await delay(500);
}
