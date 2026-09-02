import { Language, MusicStyle, ContributorRole } from './lookup.model';

const getLanguages = async () => {
  return Language.find({}).sort({ name: 1 }).select('languageId name languageCode').lean();
};

// Hierarchical: top-level genres (parentId: null) each carrying their children.
const getGenres = async () => {
  const all = await MusicStyle.find({})
    .sort({ order: 1, name: 1 })
    .select('musicStyleId name parentId order')
    .lean();
  const byParent = new Map<number | null, typeof all>();
  for (const item of all) {
    const key = item.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  const top = byParent.get(null) || [];
  return top.map(g => ({
    ...g,
    children: byParent.get(g.musicStyleId) || [],
  }));
};

const getContributorRoles = async (group?: number) => {
  const filter = group ? { contributorRoleGroupId: group } : {};
  return ContributorRole.find(filter)
    .sort({ name: 1 })
    .select('roleId name contributorRoleGroupId')
    .lean();
};

export const LookupService = { getLanguages, getGenres, getContributorRoles };
