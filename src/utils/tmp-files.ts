// src/utils/tmp-files.ts
import fs from 'fs';

declare global {
  // hot-reload (dev) এ ডুপ্লিকেট এড়াতে globalThis-এ রাখছি
  // eslint-disable-next-line no-var
  var __TMP_FILES__: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var __TMP_CLEANUP_INSTALLED__: boolean | undefined;
}

export const tmpFiles = (globalThis.__TMP_FILES__ ??= new Set<string>());

export const addTmpFile = (p: string) => tmpFiles.add(p);
export const removeTmpFile = (p: string) => tmpFiles.delete(p);

const cleanup = () => {
  for (const f of tmpFiles) {
    // eslint-disable-next-line no-empty
    try {
      fs.unlinkSync(f);
      // eslint-disable-next-line no-empty
    } catch {}
  }
  tmpFiles.clear();
};

if (!globalThis.__TMP_CLEANUP_INSTALLED__) {
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(1);
  });
  process.on('uncaughtException', err => {
    console.error(err);
    cleanup();
    process.exit(1);
  });
  globalThis.__TMP_CLEANUP_INSTALLED__ = true;
}
