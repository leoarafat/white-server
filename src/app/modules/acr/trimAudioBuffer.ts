/* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// import ffmpeg from 'fluent-ffmpeg';
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
// import { PassThrough } from 'stream';
// import { logger } from '../../../shared/logger';

// ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// export const trimAudioBuffer = (
//   inputBuffer: Buffer,
//   startTime: number = 0,
//   duration: number = 15,
// ): Promise<Buffer> => {
//   return new Promise((resolve, reject) => {
//     const inputStream = new PassThrough();
//     inputStream.end(inputBuffer);

//     const outputChunks: Buffer[] = [];
//     const outputStream = new PassThrough();

//     ffmpeg(inputStream)
//       .setStartTime(startTime)
//       .setDuration(duration)
//       .audioChannels(2)
//       .audioFrequency(44100)
//       .audioBitrate('192k')
//       .format('wav')
//       .on('error', err => {
//         logger.error('Error trimming audio:', err);
//         reject(err);
//       })
//       .on('end', () => {
//         //@ts-ignore
//         resolve(Buffer.concat(outputChunks));
//       })
//       .pipe(outputStream, { end: true });

//     outputStream.on('data', chunk => {
//       outputChunks.push(chunk);
//     });
//   });
// };
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { PassThrough } from 'stream';
import { logger } from '../../../shared/logger';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * ✅ Trim an audio buffer to a specific time range
 *
 * Fixes from original:
 * - Stream is always destroyed after use (no leaks)
 * - Timeout prevents hanging forever
 * - Lower frequency (16kHz) — ACR Cloud only needs 8-16kHz
 * - Mono channel — smaller buffer, same recognition accuracy
 */
export const trimAudioBuffer = (
  inputBuffer: Buffer,
  startTime: number = 0,
  duration: number = 15,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    if (!inputBuffer || inputBuffer.length === 0) {
      return reject(new Error('trimAudioBuffer: input buffer is empty'));
    }

    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    const outputChunks: Buffer[] = [];

    // ✅ Timeout: kill if ffmpeg hangs
    const timeout = setTimeout(() => {
      inputStream.destroy();
      outputStream.destroy();
      reject(new Error('trimAudioBuffer timed out after 30s'));
    }, 30_000);

    const cleanup = () => {
      clearTimeout(timeout);
      inputStream.destroy();
      outputStream.destroy();
    };

    outputStream.on('data', (chunk: Buffer) => {
      outputChunks.push(chunk);
    });

    ffmpeg(inputStream)
      .setStartTime(startTime)
      .setDuration(duration)
      .audioChannels(1) // ✅ Mono — ACR Cloud works fine with mono
      .audioFrequency(16000) // ✅ 16kHz — ACR minimum, saves memory vs 44100
      .audioBitrate('64k') // ✅ Lower bitrate — enough for fingerprinting
      .format('wav')
      .on('error', err => {
        cleanup();
        logger.error('trimAudioBuffer ffmpeg error:', err.message);
        reject(err);
      })
      .on('end', () => {
        cleanup();
        //@ts-ignore
        const result = Buffer.concat(outputChunks);
        if (result.length === 0) {
          return reject(new Error('trimAudioBuffer produced empty output'));
        }
        resolve(result);
      })
      .pipe(outputStream, { end: true });

    // ✅ Write input buffer AFTER pipe is set up
    inputStream.end(inputBuffer);
  });
};
