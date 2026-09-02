/* eslint-disable no-console */
import mongoose from 'mongoose';
import path from 'path';
import config from '../../../config';
import { Language, MusicStyle, ContributorRole } from './lookup.model';

// One-off idempotent seed — run manually (see server/REVELATOR-SETUP.md /
// deploy runbook). Safe to re-run: each entry is upserted by its natural id.
async function seedCollection(
  Model: typeof Language | typeof MusicStyle | typeof ContributorRole,
  file: string,
  idField: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rows: Record<string, unknown>[] = require(path.join(
    __dirname,
    'seed-data',
    file,
  ));
  let count = 0;
  for (const row of rows) {
    await (Model as typeof Language).findOneAndUpdate(
      { [idField]: row[idField] },
      row as any,
      { upsert: true },
    );
    count += 1;
  }
  return count;
}

async function run() {
  await mongoose.connect(config.database_url as string);
  const languages = await seedCollection(Language, 'languages.json', 'languageId');
  const musicStyles = await seedCollection(
    MusicStyle,
    'musicstyles.json',
    'musicStyleId',
  );
  const contributorRoles = await seedCollection(
    ContributorRole,
    'contributorroles.json',
    'roleId',
  );
  console.log('Lookup seed complete:', {
    languages,
    musicStyles,
    contributorRoles,
  });
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Lookup seed failed:', err);
  process.exit(1);
});
