import { ISingleTrack } from '../../app/modules/single-track/single.interface';

export type RevelatorAudioAssetForm = {
  hasIsrc: boolean;
  isrc?: string;
  language: string;
  title: string;
  version?: string;
  primaryGenre: string;
  secondaryGenre?: string;
  copyrightPYear: string;
  copyrightPText: string;
  isExplicit: boolean;
  hasLyrics: boolean;
  lyrics?: string;
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
    primaryGenre: track.genre,
    secondaryGenre: track.subGenre || undefined,
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
