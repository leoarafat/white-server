import crypto from 'crypto';

export const generateReleaseReference = (): string =>
  String(crypto.randomInt(100000, 1000000));

export const toPublicRelease = (doc: any) => ({
  id: doc._id,
  reference: doc.reference,
  externalId: doc.externalId,
  title: doc.title,
  isrc: doc.isrc,
  isrcAssignedByPlatform: doc.isrcAssignedByPlatform,
  status: doc.status,
  statusDetail: doc.statusDetail,
  reason: doc.reason,
  primaryArtist: doc.primaryArtist,
  featuringArtists: doc.featuringArtists,
  label: doc.label,
  genre: doc.genre,
  language: doc.language,
  releaseDate: doc.releaseDate,
  channel: doc.channel,
  imageUrl: doc.imageUrl,
  description: doc.description,
  keywords: doc.keywords,
  composer: doc.composer,
  producer: doc.producer,
  editor: doc.editor,
  musicDirector: doc.musicDirector,
  copyrightYear: doc.copyrightYear,
  // Live link once delivered — null through every other state, mirroring
  // the confirmed reference contract (§2.3). The partner's own source media
  // URL is intentionally never echoed back under this name.
  videoUrl: doc.videoUrl,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
