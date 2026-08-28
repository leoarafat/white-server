// import ffmpeg from 'fluent-ffmpeg';
// import ffprobeStatic from 'ffprobe-static';
// import crypto from 'crypto';
// import path from 'path';
// import fs from 'fs';
// import AWS from 'aws-sdk';
// import config from '../../../config';

// // ============================================================
// // ffprobe binary resolution
// // On Linux servers we use system ffprobe (apt-installed) because
// // the static binary from ffprobe-static segfaults on certain
// // kernel + libc combinations. On Windows/Mac dev machines we fall
// // back to the bundled static binary.
// // ============================================================
// const SYSTEM_FFPROBE = '/usr/bin/ffprobe';
// const ffprobePath = fs.existsSync(SYSTEM_FFPROBE)
//   ? SYSTEM_FFPROBE
//   : ffprobeStatic.path;

// ffmpeg.setFfprobePath(ffprobePath);
// console.log(`[media-metadata] Using ffprobe at: ${ffprobePath}`);

// const s3 = new AWS.S3({
//   accessKeyId: config.aws.accessKeyId,
//   secretAccessKey: config.aws.secretAccessKey,
//   region: config.aws.region,
// });

// // ============================================================
// // Public API
// // ============================================================

// export const getMediaDurationFromS3 = async (
//   s3Url: string,
//   attempt = 1,
// ): Promise<number> => {
//   const MAX_ATTEMPTS = 3;
//   try {
//     return await probeDuration(s3Url);
//   } catch (err: any) {
//     if (attempt < MAX_ATTEMPTS) {
//       console.warn(
//         `[media-metadata] Probe attempt ${attempt} failed: ${err.message?.split('\n')[0]} — retrying`,
//       );
//       await new Promise(r => setTimeout(r, 1000 * attempt));
//       return getMediaDurationFromS3(s3Url, attempt + 1);
//     }
//     throw err;
//   }
// };

// export const getFileMd5FromS3 = async (s3Url: string): Promise<string> => {
//   const { bucket, key } = parseS3Url(s3Url);
//   const head = await s3.headObject({ Bucket: bucket, Key: key }).promise();
//   const etag = (head.ETag || '').replace(/"/g, '');

//   if (etag.includes('-')) {
//     return streamingMd5(bucket, key);
//   }
//   return etag;
// };

// export const streamingMd5 = (bucket: string, key: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const stream = s3
//       .getObject({ Bucket: bucket, Key: key })
//       .createReadStream();
//     const hash = crypto.createHash('md5');
//     stream.on('data', d => hash.update(d));
//     stream.on('end', () => resolve(hash.digest('hex')));
//     stream.on('error', reject);
//   });
// };

// export const getFileNameFromS3Url = (s3Url: string): string =>
//   path.basename(new URL(s3Url).pathname);

// export const formatDuration = (durationMs: number): string => {
//   const totalSeconds = Math.floor(durationMs / 1000);
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = totalSeconds % 60;
//   return `PT${hours}H${minutes}M${seconds}S`;
// };

// // ============================================================
// // Internal helpers
// // ============================================================

// const probeDuration = (s3Url: string): Promise<number> => {
//   return new Promise((resolve, reject) => {
//     const { bucket, key } = parseS3Url(s3Url);
//     const signedUrl = s3.getSignedUrl('getObject', {
//       Bucket: bucket,
//       Key: key,
//       Expires: 600,
//     });

//     const timeout = setTimeout(() => {
//       reject(new Error('ffprobe timed out after 30s'));
//     }, 30_000);

//     ffmpeg.ffprobe(signedUrl, (err, data) => {
//       clearTimeout(timeout);
//       if (err) return reject(err);

//       const durationSeconds = data?.format?.duration;
//       if (!durationSeconds || isNaN(durationSeconds)) {
//         return reject(new Error('Could not determine duration from metadata'));
//       }
//       resolve(Math.floor(durationSeconds * 1000));
//     });
//   });
// };

// const parseS3Url = (s3Url: string): { bucket: string; key: string } => {
//   const url = new URL(s3Url);
//   const hostParts = url.hostname.split('.');

//   if (hostParts[0] === 's3' || hostParts[0].startsWith('s3-')) {
//     const pathParts = url.pathname.substring(1).split('/');
//     return {
//       bucket: pathParts[0],
//       key: decodeURIComponent(pathParts.slice(1).join('/')),
//     };
//   }

//   return {
//     bucket: hostParts[0],
//     key: decodeURIComponent(url.pathname.substring(1)),
//   };
// };
