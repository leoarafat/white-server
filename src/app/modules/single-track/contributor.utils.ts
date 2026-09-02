import { IContributor } from './single.interface';

// Role names below match the seeded ContributorRole data (see
// server/src/app/modules/lookup/seed-data/contributorroles.json) — group 4
// (Writer/Publisher) role names like "Composer", "Arranger", "Writer".
const ROLE_GROUP = { KEY_ARTIST: 1, PERFORMER: 2, PRODUCER_ENGINEER: 3, WRITER: 4 } as const;

const namesForRole = (contributors: IContributor[], roleName: string): string[] =>
  contributors
    .filter(c => c.roleName.toLowerCase() === roleName.toLowerCase())
    .map(c => c.name);

const namesForGroup = (contributors: IContributor[], groupId: number): string[] =>
  contributors.filter(c => c.roleGroupId === groupId).map(c => c.name);

// Derives the pre-existing flat fields (author, composer, arranger, producer,
// remixer, publisher, featuringArtists, musicDirector) from the new
// role-based `contributors[]` array, so tables/CSV exports/anything still
// reading the old fields keeps working without changes. Best-effort mapping,
// not a strict inverse — a track with several Writers just uses the first as
// `author` for display purposes; the full list stays in `contributors[]`.
export function mapContributorsToLegacyFields(contributors: IContributor[] = []) {
  const writers = namesForGroup(contributors, ROLE_GROUP.WRITER);
  const composers = namesForRole(contributors, 'Composer');
  const arrangers = namesForRole(contributors, 'Arranger');
  const producers = namesForGroup(contributors, ROLE_GROUP.PRODUCER_ENGINEER);
  const remixers = namesForRole(contributors, 'Remixer');
  const featuring = contributors
    .filter(c => c.roleGroupId === ROLE_GROUP.KEY_ARTIST && c.roleName.toLowerCase() === 'featuring')
    .map(c => c.name);

  return {
    author: writers[0] || undefined,
    writer: writers,
    composer: composers[0] || undefined,
    arranger: arrangers[0] || undefined,
    producer: producers[0] || undefined,
    remixer: remixers[0] || undefined,
    publisher: namesForRole(contributors, 'Publisher')[0] || undefined,
    musicDirector: namesForGroup(contributors, ROLE_GROUP.PRODUCER_ENGINEER),
    featuringArtists: featuring,
  };
}

const isEmpty = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0);

// Fills flat legacy fields from contributors[] onto `data`, but ONLY where
// `data` doesn't already carry an explicit value for that field — e.g. the
// upload form submits `featuringArtists` directly (via its own Featuring
// Artists picker) AND contributors[] may separately include a "Featuring"
// Key Artist; blindly overwriting with Object.assign would let an empty
// contributors-derived list wipe out an explicitly chosen value.
export function mergeContributorLegacyFields(
  data: Record<string, unknown>,
  contributors: IContributor[] = [],
): void {
  const mapped = mapContributorsToLegacyFields(contributors);
  for (const [key, value] of Object.entries(mapped)) {
    if (isEmpty(data[key]) && !isEmpty(value)) {
      data[key] = value;
    }
  }
}

// Revelator's own confirmed convention (revelatorfinal.md §7.3): a single
// concatenated "{year} {text}" string, not a separate {year, text} object.
export function concatCopyright(year?: string, text?: string): string | undefined {
  if (!year && !text) return undefined;
  return [year, text].filter(Boolean).join(' ').trim();
}
