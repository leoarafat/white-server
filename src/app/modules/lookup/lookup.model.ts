import { Schema, model } from 'mongoose';

// Mirrors Revelator's /common/lookup/languages shape (see revelatorfinal.md §4.1) —
// seeded once from a real, authorized export of the sibling ptune project's own
// Revelator-synced data (see seed-data/), not fetched live (no direct API access here).
const languageSchema = new Schema(
  {
    languageId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    languageCode: { type: String, required: true },
  },
  { timestamps: true },
);
export const Language = model('Language', languageSchema);

// Mirrors §4.2 — hierarchical via parentId (top-level genre -> sub-genres).
const musicStyleSchema = new Schema(
  {
    musicStyleId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    parentId: { type: Number, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const MusicStyle = model('MusicStyle', musicStyleSchema);

// Mirrors §4.3 — contributorRoleGroupId: 1=Key Artist, 2=Performer,
// 3=Producer & Engineer, 4=Writer/Publisher.
const contributorRoleSchema = new Schema(
  {
    roleId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    contributorRoleGroupId: { type: Number, required: true },
  },
  { timestamps: true },
);
export const ContributorRole = model('ContributorRole', contributorRoleSchema);
