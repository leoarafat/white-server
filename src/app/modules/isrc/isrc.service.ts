import { Mutex } from 'async-mutex';
import { getUserISRC } from '../statics/isrcs';

// Shared mutex so a concurrent HTTP call (POST /isrc/generate) and an
// internal call from single.service.ts (auto-generate on upload when the
// user has no ISRC) can never race each other onto the same next number.
const isrcMutex = new Mutex();

export const generateNextIsrc = async (): Promise<string> => {
  return isrcMutex.runExclusive(async () => {
    const userISRCs = await getUserISRC();
    const validISRCs = userISRCs.filter((isrc: string) =>
      /^QT6X6\d{7}$/.test(isrc.trim()),
    );

    if (validISRCs.length === 0) return 'QT6X62500001';

    const sorted = validISRCs.sort((a, b) => {
      const aNum = parseInt(a.slice(-7));
      const bNum = parseInt(b.slice(-7));
      return aNum - bNum;
    });
    const lastISRC = sorted[sorted.length - 1];
    const numericPart = parseInt(lastISRC.slice(-7), 10);
    const nextNumber = numericPart + 1;
    return `QT6X6${nextNumber.toString().padStart(7, '0')}`;
  });
};
