import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import { logger } from '../../shared/logger';

// Same dedicated-temp-dir-on-disk pattern as catalog-video/vevo-s3.ts's
// downloadToTempFile (NOT /tmp, which is tmpfs/RAM) — the bot needs a real
// local file path to hand to Puppeteer's `input[type=file]`.upload_file().
function resolveDir(envVar: string | undefined, subdir: string): string {
  const candidates = [
    envVar,
    path.join(process.cwd(), '.tmp', subdir),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (err) {
      logger.warn(`Revelator bot temp dir unavailable: ${dir}`, err);
    }
  }
  throw new Error(`No writable temp directory for "${subdir}"`);
}

export async function downloadToTempFile(
  url: string,
  suffix: string,
  dirEnvVar?: string,
): Promise<string> {
  const dir = resolveDir(dirEnvVar, 'revelator');
  const tempPath = path.join(
    dir,
    `revelator-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`,
  );

  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
    timeout: 0,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const writer = fs.createWriteStream(tempPath);
  try {
    await pipeline(response.data, writer);
    return tempPath;
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

export function cleanupTempFile(filePath?: string | null): void {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // best-effort
  }
}
