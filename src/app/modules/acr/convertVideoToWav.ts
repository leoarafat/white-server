/* eslint-disable no-unused-vars */
// import os from 'os';
// import path from 'path';
// import fs, { promises as fsPromises } from 'fs';
// import ffmpeg from '../../../config/ffmpeg.config';
// import { v4 as uuidv4 } from 'uuid';

// const safeUnlink = async (filePath: string) => {
//   try {
//     if (fs.existsSync(filePath)) {
//       await fsPromises.unlink(filePath);
//     }
//   } catch (e) {
//     console.warn('⚠️ Failed to delete temp file:', filePath, e);
//   }
// };

// export const convertVideoToWav = async (
//   tempVideoPath: string,
//   duration: number,
// ): Promise<Buffer> => {
//   const tempWavPath = path.join(os.tmpdir(), `${uuidv4()}.wav`);

//   return new Promise((resolve, reject) => {
//     ffmpeg(tempVideoPath)
//       .noVideo()
//       .audioCodec('pcm_s16le')
//       .audioFrequency(44100)
//       .audioChannels(2)
//       .format('wav')
//       .duration(duration)
//       .on('error', async err => {
//         await safeUnlink(tempVideoPath);
//         await safeUnlink(tempWavPath);
//         reject(err);
//       })
//       .on('end', async () => {
//         try {
//           const wavBuffer = await fsPromises.readFile(tempWavPath);
//           await safeUnlink(tempVideoPath);
//           await safeUnlink(tempWavPath);
//           resolve(wavBuffer);
//         } catch (readErr) {
//           reject(readErr);
//         }
//       })
//       .save(tempWavPath);
//   });
// };
import fs, { promises as fsPromises } from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const safeUnlink = async (filePath: string): Promise<void> => {
  try {
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  } catch {
    // Non-fatal
  }
};

/**
 * ✅ Convert a local temp video file to WAV buffer
 *
 * NOTE: With the new downloadPartialVideoToTempFile,
 * this function receives a tiny ~20s snippet (not a full video).
 * So temp WAV file is now only ~1-2MB instead of hundreds of MB.
 *
 * Always cleans up both input and output temp files.
 */
export const convertVideoToWav = async (
  tempVideoPath: string,
  duration: number,
): Promise<Buffer> => {
  const tempWavPath = path.join(os.tmpdir(), `acr-${uuidv4()}.wav`);

  // ✅ Timeout: kill if ffmpeg hangs
  let resolvePromise: (buf: Buffer) => void;
  let rejectPromise: (err: Error) => void;

  const promise = new Promise<Buffer>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const timeout = setTimeout(async () => {
    await safeUnlink(tempVideoPath);
    await safeUnlink(tempWavPath);
    rejectPromise(new Error('convertVideoToWav timed out after 60s'));
  }, 60_000);

  ffmpeg(tempVideoPath)
    .noVideo()
    .audioCodec('pcm_s16le')
    .audioFrequency(16000) // ✅ 16kHz — enough for ACR fingerprinting
    .audioChannels(1) // ✅ Mono
    .format('wav')
    .duration(duration)
    .on('error', async err => {
      clearTimeout(timeout);
      await safeUnlink(tempVideoPath);
      await safeUnlink(tempWavPath);
      rejectPromise(
        new Error(`convertVideoToWav ffmpeg error: ${err.message}`),
      );
    })
    .on('end', async () => {
      clearTimeout(timeout);
      try {
        const wavBuffer = await fsPromises.readFile(tempWavPath);
        await safeUnlink(tempVideoPath); // ✅ Always delete input
        await safeUnlink(tempWavPath); // ✅ Always delete output
        if (wavBuffer.length === 0) {
          return rejectPromise(
            new Error('convertVideoToWav produced empty WAV'),
          );
        }
        resolvePromise(wavBuffer);
      } catch (readErr: any) {
        await safeUnlink(tempVideoPath);
        await safeUnlink(tempWavPath);
        rejectPromise(readErr);
      }
    })
    .save(tempWavPath);

  return promise;
};
