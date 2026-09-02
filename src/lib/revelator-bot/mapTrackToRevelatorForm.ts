import { ISingleTrack } from '../../app/modules/single-track/single.interface';

export type RevelatorAudioAssetForm = {
  hasIsrc: boolean;
  isrc?: string;
  language: string;
  title: string;
  version?: string;
  primaryArtists: string[];
  primaryGenre: string;
  secondaryGenre?: string;
  origin: 'original' | 'public-domain' | 'cover';
  trackProperties: string[];
  copyrightPYear: string;
  copyrightPText: string;
  isExplicit: boolean;
  hasLyrics: boolean;
  lyrics?: string;
};

// track.origin -> the exact radio-card label text on Revelator's "Create
// Audio Asset" / "Release Details" forms (live-confirmed).
export const ORIGIN_LABELS: Record<RevelatorAudioAssetForm['origin'], string> = {
  original: 'Original Work',
  'public-domain': 'Public Domain & Traditional',
  cover: 'Cover Song',
};

// track.trackProperties entries -> Revelator's "Properties" toggle-button
// labels (live-confirmed on the real "Create Audio Asset" form). Unmapped
// values are dropped rather than guessed at.
export const TRACK_PROPERTY_LABELS: Record<string, string> = {
  remix: 'Remix or Derivative',
  samples: 'Samples or Stock',
  compilation: 'Mix or Compilation',
  'alternate-version': 'Alternate Version',
  'special-genre': 'Special Genre',
  'non-musical': 'Non-Musical Content',
  'includes-ai': 'Includes AI',
};

export type RevelatorReleaseForm = {
  language: string;
  title: string;
  version?: string;
  primaryArtists: string[];
  primaryGenre: string;
  secondaryGenre?: string;
  hasLabel: boolean;
  labelName?: string;
  previouslyReleased: boolean;
  upc?: string;
  catalogId?: string;
  copyrightPYear: string;
  copyrightPText: string;
  copyrightCYear: string;
  copyrightCText: string;
};

const currentYear = () => String(new Date().getFullYear());

// Splits a stored "YYYY Label Name" copyright string (see [[ptune-revelator-integration]]
// on Revelator's own single-string convention) back into year + text for the
// form's separate year-select + text-input pair. Falls back to the track's
// production year / label when the stored string doesn't parse.
function splitCopyright(
  raw: string | undefined,
  fallbackYear: string,
  fallbackText: string,
): { year: string; text: string } {
  const match = raw?.match(/^(\d{4})\s+(.+)$/);
  if (match) return { year: match[1], text: match[2] };
  return { year: fallbackYear, text: raw || fallbackText };
}

export function mapAudioAssetForm(
  track: ISingleTrack,
): RevelatorAudioAssetForm {
  const pCopy = splitCopyright(
    track.pLine,
    track.productionYear || currentYear(),
    track.label,
  );
  return {
    hasIsrc: Boolean(track.isrc),
    isrc: track.isrc || undefined,
    language: track.trackTitleLanguage,
    title: track.title,
    version: track.subtitle || undefined,
    primaryArtists: track.primaryArtist || [],
    primaryGenre: track.genre,
    secondaryGenre: track.subGenre || undefined,
    origin: track.origin || 'original',
    trackProperties: track.trackProperties || [],
    copyrightPYear: pCopy.year,
    copyrightPText: pCopy.text,
    isExplicit: track.parentalAdvisory === 'Explicit',
    hasLyrics: Boolean(track.lyrics),
    lyrics: track.lyrics || undefined,
  };
}

export function mapReleaseForm(track: ISingleTrack): RevelatorReleaseForm {
  const pCopy = splitCopyright(
    track.pLine,
    track.productionYear || currentYear(),
    track.label,
  );
  const cCopy = splitCopyright(
    track.cLine,
    track.productionYear || currentYear(),
    track.publisher || track.label,
  );
  return {
    language: track.trackTitleLanguage,
    title: track.releaseTitle || track.title,
    version: track.subtitle || undefined,
    primaryArtists: track.primaryArtist || [],
    primaryGenre: track.genre,
    secondaryGenre: track.subGenre || undefined,
    hasLabel: Boolean(track.label),
    labelName: track.label || undefined,
    previouslyReleased: false,
    upc: track.upc || undefined,
    catalogId: track.catalogNumber || undefined,
    copyrightPYear: pCopy.year,
    copyrightPText: pCopy.text,
    copyrightCYear: cCopy.year,
    copyrightCText: cCopy.text,
  };
}
