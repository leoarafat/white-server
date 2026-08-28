// /* eslint-disable @typescript-eslint/ban-ts-comment */

// import axios from 'axios';
// import fs from 'fs';
// import os from 'os';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import ffmpeg from 'fluent-ffmpeg';

// /**
//  * ✅ পুরো ভিডিও না নামিয়ে শুধুমাত্র প্রথম durationSeconds সেকেন্ড ডাউনলোড করে রাখে।
//  */
// export const downloadPartialVideoToTempFile = async (
//   videoUrl: string,
//   durationSeconds: number = 25, // 🔥 ডিফল্ট: 25 সেকেন্ড
// ): Promise<string> => {
//   const tempFullVideoPath = path.join(os.tmpdir(), `${uuidv4()}-full.mp4`);
//   const tempTrimmedPath = path.join(os.tmpdir(), `${uuidv4()}-trimmed.mp4`);

//   // 🔽 1. ভিডিও ডাউনলোড (stream হিসেবে)
//   const response = await axios.get(videoUrl, { responseType: 'stream' });
//   const writer = fs.createWriteStream(tempFullVideoPath);

//   await new Promise<void>((resolve, reject) => {
//     response.data.pipe(writer);
//     writer.on('finish', resolve);
//     writer.on('error', reject);
//   });

//   // ✂️ 2. FFmpeg দিয়ে প্রথম X সেকেন্ড কেটে রাখা
//   await new Promise<void>((resolve, reject) => {
//     ffmpeg(tempFullVideoPath)
//       .setStartTime(0)
//       .setDuration(durationSeconds)
//       .output(tempTrimmedPath)
//       //@ts-ignore
//       .on('end', resolve)
//       .on('error', reject)
//       .run();
//   });

//   // 🧹 3. মূল বড় ভিডিও ফাইল ডিলিট করে দাও
//   if (fs.existsSync(tempFullVideoPath)) {
//     fs.unlinkSync(tempFullVideoPath);
//   }

//   return tempTrimmedPath;
// };
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * ✅ Cleanup temp file safely — call in finally block
 */
export const cleanupTempFile = (filePath: string | null): void => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Non-fatal — never crash on cleanup failure
  }
};

/**
 * ✅ Production-grade partial video extractor
 *
 * BEFORE: Downloads full video (500MB+) to /tmp → then trims
 * AFTER:  ffmpeg streams directly from URL → writes only tiny WAV snippet (~1MB)
 *
 * - Zero full video download
 * - /tmp usage: ~1-2MB per request instead of 500MB+
 * - Works with S3 pre-signed URLs, CDN URLs, any HTTP URL
 */
export const downloadPartialVideoToTempFile = async (
  videoUrl: string,
  durationSeconds: number = 20,
): Promise<string> => {
  const tempOutputPath = path.join(os.tmpdir(), `acr-${uuidv4()}-snippet.wav`);

  await new Promise<void>((resolve, reject) => {
    // ✅ Timeout: kill if ffmpeg hangs more than 60 seconds
    const timeout = setTimeout(() => {
      command.kill('SIGKILL');
      cleanupTempFile(tempOutputPath);
      reject(new Error('ffmpeg timed out after 60s'));
    }, 60_000);

    const command = ffmpeg(videoUrl)
      .inputOptions([
        '-t',
        String(durationSeconds), // ✅ Read ONLY first N seconds from source stream
      ])
      .noVideo() // ✅ Skip video decoding entirely — audio only
      .audioChannels(1) // Mono — smaller file, enough for ACR
      .audioFrequency(16000) // 16kHz — ACR Cloud minimum requirement
      .audioCodec('pcm_s16le') // Raw PCM WAV
      .duration(durationSeconds)
      .output(tempOutputPath)
      .on('end', () => {
        clearTimeout(timeout);
        resolve();
      })
      .on('error', err => {
        clearTimeout(timeout);
        cleanupTempFile(tempOutputPath);
        reject(new Error(`ffmpeg failed: ${err.message}`));
      });

    command.run();
  });

  // Verify output was actually created and has content
  if (!fs.existsSync(tempOutputPath)) {
    throw new Error('ffmpeg produced no output file');
  }

  const stats = fs.statSync(tempOutputPath);
  if (stats.size === 0) {
    cleanupTempFile(tempOutputPath);
    throw new Error('ffmpeg produced empty output file');
  }

  return tempOutputPath;
};
