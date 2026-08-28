// /* eslint-disable @typescript-eslint/ban-ts-comment */

// import AWS from 'aws-sdk';
// import ApiError from '../../../errors/ApiError';
// import config from '../../../config';
// import axios from 'axios';
// import { logger } from '../../../shared/logger';
// import stream from 'stream';
// import { promisify } from 'util';

// // Configure S3 with improved settings
// const vevoS3 = new AWS.S3({
//   region: config.vevo.region,
//   accessKeyId: config.vevo.accessKey,
//   secretAccessKey: config.vevo.secretKey,
//   httpOptions: {
//     timeout: 900000,
//     connectTimeout: 30000,
//   },
//   maxRetries: 3,
//   //@ts-ignore
//   s3RetryCount: 3,
//   s3ForcePathStyle: false,
// });

// // Use streams for better memory management with large files
// promisify(stream.pipeline);

// const uploadFileToS3 = async (
//   fileStream: stream.Readable | Buffer,
//   key: string,
//   contentType: string,
// ): Promise<AWS.S3.ManagedUpload.SendData> => {
//   const bucket = config.vevo.bucket;
//   if (!bucket) {
//     logger.error('Bucket configuration not found');
//     throw new ApiError(404, 'Bucket not found');
//   }

//   logger.info(`Starting S3 upload for key: ${key}`, {
//     bucket,
//     contentType,
//     key,
//   });

//   const uploadParams: AWS.S3.PutObjectRequest = {
//     Bucket: bucket,
//     Key: key,
//     Body: fileStream,
//     ContentType: contentType,
//   };

//   try {
//     // Use managed upload for automatic multipart upload handling
//     const uploader = vevoS3.upload(uploadParams, {
//       queueSize: 4, // Number of parallel uploads for multipart
//       partSize: 10 * 1024 * 1024, // 10MB part size
//       leavePartsOnError: false,
//     });

//     // Track upload progress
//     uploader.on('httpUploadProgress', progress => {
//       logger.debug('Upload progress:', {
//         key,
//         loaded: progress.loaded,
//         total: progress.total,
//         percentage: (progress.loaded / progress.total) * 100,
//       });
//     });

//     const result = await uploader.promise();

//     logger.info(`Upload successful for ${key}`, {
//       location: result.Location,
//       size:
//         result.Location && Buffer.isBuffer(uploadParams.Body)
//           ? `~${Math.round((uploadParams.Body as Buffer).length / (1024 * 1024))}MB`
//           : 'unknown',
//       bucket: result.Bucket,
//       key: result.Key,
//     });

//     return result;
//   } catch (error: any) {
//     logger.error(`Error uploading file ${key} to S3`, {
//       error: error.message,
//       stack: error.stack,
//       bucket,
//       key,
//     });
//     throw new ApiError(500, `S3 upload failed: ${error.message}`);
//   }
// };

// const downloadFile = async (url: string): Promise<stream.Readable> => {
//   logger.info(`Starting download from URL: ${url}`);

//   try {
//     const response = await axios({
//       method: 'get',
//       url,
//       responseType: 'stream',
//       timeout: 300000, // 5 minutes timeout
//       maxContentLength: Infinity, // Allow any size
//     });

//     logger.info(`Download initiated from ${url}`, {
//       status: response.status,
//       contentLength: response.headers['content-length'],
//       contentType: response.headers['content-type'],
//     });

//     // Create a pass-through stream to monitor progress
//     const passThrough = new stream.PassThrough();
//     let bytesDownloaded = 0;
//     const contentLength = parseInt(
//       response.headers['content-length'] || '0',
//       10,
//     );

//     response.data.on('data', (chunk: Buffer) => {
//       bytesDownloaded += chunk.length;
//       if (contentLength > 0) {
//         const percent = ((bytesDownloaded / contentLength) * 100).toFixed(2);
//         logger.debug(`Download progress: ${percent}%`, {
//           url,
//           downloaded: `${(bytesDownloaded / (1024 * 1024)).toFixed(2)}MB`,
//           total: contentLength
//             ? `${(contentLength / (1024 * 1024)).toFixed(2)}MB`
//             : 'unknown',
//         });
//       }
//     });

//     // Pipe the response through our pass-through stream
//     response.data.pipe(passThrough);

//     return passThrough;
//   } catch (error: any) {
//     logger.error(`Error downloading file from ${url}`, {
//       error: error.message,
//       responseStatus: error.response?.status,
//       stack: error.stack,
//       url,
//     });
//     throw new ApiError(500, `Download failed: ${error.message}`);
//   }
// };

// export const uploadXmlToS3 = async (
//   xmlContent: string,
//   folderName: string,
//   fileName: string,
//   videoUrl: string,
//   imageUrl: string,
//   isrcs: string,
// ): Promise<AWS.S3.ManagedUpload.SendData> => {
//   logger.info('Starting VEVO S3 upload process', {
//     folderName,
//     fileName,
//     isrcs,
//     videoUrl,
//     imageUrl,
//   });

//   const bucket = config.vevo.bucket;
//   if (!bucket) {
//     logger.error('Bucket configuration not found in VEVO config');
//     throw new ApiError(404, 'Bucket not found');
//   }

//   // Process video first
//   const videoKey = `feed/ansenterprise/${folderName}/${isrcs}.mp4`;
//   try {
//     logger.info(`Starting video download from: ${videoUrl}`);
//     const videoStream = await downloadFile(videoUrl);

//     logger.info(`Starting video upload to S3 with key: ${videoKey}`);
//     await uploadFileToS3(videoStream, videoKey, 'video/mp4');
//     logger.info(`Video upload completed successfully: ${videoKey}`);
//   } catch (error: any) {
//     logger.error('Video processing failed', {
//       error: error.message,
//       videoUrl,
//       videoKey,
//       stack: error.stack,
//     });
//     throw new ApiError(500, `Video processing failed: ${error.message}`);
//   }

//   // Process image next
//   const imageKey = `feed/ansenterprise/${folderName}/${isrcs}.jpg`;
//   try {
//     logger.info(`Starting image download from: ${imageUrl}`);
//     const imageStream = await downloadFile(imageUrl);

//     logger.info(`Starting image upload to S3 with key: ${imageKey}`);
//     await uploadFileToS3(imageStream, imageKey, 'image/jpg');
//     logger.info(`Image upload completed successfully: ${imageKey}`);
//   } catch (error: any) {
//     logger.error('Image processing failed', {
//       error: error.message,
//       imageUrl,
//       imageKey,
//       stack: error.stack,
//     });
//     throw new ApiError(500, `Image processing failed: ${error.message}`);
//   }

//   // Process XML manifest last
//   const xmlKey = `feed/ansenterprise/${folderName}/manifest.xml`;
//   try {
//     logger.info(`Starting XML manifest upload to S3 with key: ${xmlKey}`);
//     const result = await uploadFileToS3(
//       Buffer.from(xmlContent),
//       xmlKey,
//       'application/xml',
//     );

//     logger.info(`XML manifest upload completed successfully: ${xmlKey}`, {
//       location: result.Location,
//       size: `${(Buffer.byteLength(xmlContent) / 1024).toFixed(2)}KB`,
//     });

//     return result;
//   } catch (error: any) {
//     logger.error('XML manifest upload failed', {
//       error: error.message,
//       stack: error.stack,
//       xmlKey,
//     });
//     throw new ApiError(500, `XML manifest upload failed: ${error.message}`);
//   }
// };
/* eslint-disable @typescript-eslint/ban-ts-comment */

import AWS from 'aws-sdk';
import axios from 'axios';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { pipeline } from 'stream/promises';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { logger } from '../../../shared/logger';

// ============================================================
// DEDICATED TEMP DIRECTORY ON DISK (NOT /tmp which is tmpfs/RAM)
// ============================================================
// Overridable so local machines don't need the production path. Falls back
// to a project-local directory when the configured one isn't writable —
// previously an unwritable path threw at module load and took the whole
// server down on startup.
const CONFIGURED_TEMP_DIR =
  process.env.VEVO_TEMP_DIR || '/var/www/ans-server/tmp/vevo';
const FALLBACK_TEMP_DIR = path.join(process.cwd(), '.tmp', 'vevo');

function resolveTempDir(): string {
  for (const dir of [CONFIGURED_TEMP_DIR, FALLBACK_TEMP_DIR]) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (err: any) {
      logger.warn(
        `VEVO temp directory unavailable: ${dir} (${err.code || err.message})`,
      );
    }
  }
  throw new Error(
    `No writable VEVO temp directory. Tried: ${CONFIGURED_TEMP_DIR}, ${FALLBACK_TEMP_DIR}`,
  );
}

const VEVO_TEMP_DIR = resolveTempDir();
logger.info(`Using VEVO temp directory: ${VEVO_TEMP_DIR}`);

// ============================================================
// S3 CLIENT CONFIGURATION
// ============================================================
const vevoS3 = new AWS.S3({
  region: config.vevo.region,
  accessKeyId: config.vevo.accessKey,
  secretAccessKey: config.vevo.secretKey,
  httpOptions: {
    timeout: 0,
    connectTimeout: 60000,
    agent: new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 50,
    }),
  },
  maxRetries: 5,
  retryDelayOptions: {
    base: 1000,
  },
  signatureVersion: 'v4',
  s3ForcePathStyle: false,
  // Uncomment after VEVO enables Transfer Acceleration on their bucket:
  // useAccelerateEndpoint: true,
});

// ============================================================
// DOWNLOAD HELPER
// ============================================================
const downloadToTempFile = async (
  url: string,
  suffix: string,
): Promise<string> => {
  const tempPath = path.join(
    VEVO_TEMP_DIR,
    `vevo-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`,
  );

  logger.info(`Downloading to temp file: ${tempPath}`, { url });

  try {
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    logger.info(`Download initiated`, {
      status: response.status,
      contentLength: response.headers['content-length'],
      contentType: response.headers['content-type'],
      url,
    });

    const writer = fs.createWriteStream(tempPath);
    await pipeline(response.data, writer);

    const stats = fs.statSync(tempPath);
    logger.info(
      `Download complete: ${tempPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
    );

    return tempPath;
  } catch (error: any) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    logger.error(`Error downloading file from ${url}`, {
      error: error.message,
      responseStatus: error.response?.status,
      stack: error.stack,
      url,
    });
    throw new ApiError(500, `Download failed: ${error.message}`);
  }
};

// ============================================================
// UPLOAD HELPER WITH RETRIES
// ============================================================
// ============================================================
// UPLOAD HELPER WITH RETRIES (fixed for NoSuchUpload error)
// ============================================================
const uploadFileFromDisk = async (
  filePath: string,
  key: string,
  contentType: string,
  attempt = 1,
): Promise<AWS.S3.ManagedUpload.SendData> => {
  const bucket = config.vevo.bucket;
  if (!bucket) {
    logger.error('VEVO bucket configuration not found');
    throw new ApiError(404, 'Bucket not found');
  }

  const stats = fs.statSync(filePath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  const MAX_ATTEMPTS = 4;

  logger.info(
    `Uploading to s3://${bucket}/${key} (${sizeMb} MB, attempt ${attempt}/${MAX_ATTEMPTS})`,
  );

  // Fresh stream every attempt — streams are not reusable
  const fileStream = fs.createReadStream(filePath);

  try {
    const uploader = vevoS3.upload(
      {
        Bucket: bucket,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ContentLength: stats.size,
      },
      {
        queueSize: 4, // reduced from 8 — less aggressive parallelism
        partSize: 10 * 1024 * 1024, // 10 MB — fewer parts = less to fail
        leavePartsOnError: true, // ← KEY FIX: don't abort session on transient errors
      },
    );

    let lastLogged = Date.now();
    uploader.on('httpUploadProgress', progress => {
      if (Date.now() - lastLogged > 5000) {
        const percent = ((progress.loaded / stats.size) * 100).toFixed(1);
        logger.info(
          `Upload progress ${key}: ${percent}% (${(progress.loaded / 1024 / 1024).toFixed(2)} MB / ${sizeMb} MB)`,
        );
        lastLogged = Date.now();
      }
    });

    const result = await uploader.promise();

    logger.info(`Upload successful: ${key}`, {
      location: result.Location,
      size: `${sizeMb} MB`,
      bucket: result.Bucket,
    });

    return result;
  } catch (err: any) {
    fileStream.destroy();

    // NoSuchUpload means the multipart session is dead.
    // We CANNOT retry it — we must start a completely fresh upload.
    // The retry below creates a new session via a new vevoS3.upload() call.
    const isNoSuchUpload = err.code === 'NoSuchUpload';

    const isRetryable =
      isNoSuchUpload ||
      err.code === 'EPIPE' ||
      err.code === 'ECONNRESET' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'TimeoutError' ||
      err.code === 'NetworkingError' ||
      err.code === 'RequestTimeout' ||
      err.code === 'RequestTimeTooSkewed' ||
      err.code === 'SlowDown' ||
      err.retryable === true;

    if (isRetryable && attempt < MAX_ATTEMPTS) {
      // Longer backoff for NoSuchUpload to let any in-flight cleanup settle
      const backoff = isNoSuchUpload
        ? attempt * 10000 // 10s, 20s, 30s for NoSuchUpload
        : attempt * 5000; // 5s, 10s, 15s for others

      logger.warn(
        `Upload failed with ${err.code}, starting fresh upload in ${backoff}ms (next attempt: ${attempt + 1}/${MAX_ATTEMPTS})`,
        { key, error: err.message },
      );
      await new Promise(r => setTimeout(r, backoff));

      // This recursive call creates a brand new vevoS3.upload() session
      // — fresh UploadId, fresh stream, fresh everything.
      return uploadFileFromDisk(filePath, key, contentType, attempt + 1);
    }

    logger.error(`Error uploading file ${key} to S3`, {
      error: err.message,
      code: err.code,
      stack: err.stack,
      bucket,
      key,
      attempt,
    });
    throw new ApiError(500, `S3 upload failed: ${err.message}`);
  }
};

// ============================================================
// MAIN EXPORT
// ============================================================
export const uploadXmlToS3 = async (
  xmlContent: string,
  folderName: string,
  fileName: string,
  videoUrl: string,
  imageUrl: string,
  isrcs: string,
): Promise<AWS.S3.ManagedUpload.SendData> => {
  logger.info('Starting VEVO S3 upload process', {
    folderName,
    fileName,
    isrcs,
    videoUrl,
    imageUrl,
  });

  const bucket = config.vevo.bucket;
  if (!bucket) {
    logger.error('Bucket configuration not found in VEVO config');
    throw new ApiError(404, 'Bucket not found');
  }

  const tempFiles: string[] = [];

  try {
    // ---------- 1. VIDEO ----------
    const videoKey = `feed/ansenterprise/${folderName}/${isrcs}.mp4`;
    let videoTempPath: string;

    try {
      videoTempPath = await downloadToTempFile(videoUrl, '.mp4');
      tempFiles.push(videoTempPath);
    } catch (error: any) {
      logger.error('Video download failed', {
        error: error.message,
        videoUrl,
        stack: error.stack,
      });
      throw new ApiError(500, `Video download failed: ${error.message}`);
    }

    try {
      await uploadFileFromDisk(videoTempPath, videoKey, 'video/mp4');
    } catch (error: any) {
      logger.error('Video upload failed', {
        error: error.message,
        videoKey,
        stack: error.stack,
      });
      throw new ApiError(500, `Video upload failed: ${error.message}`);
    }

    // Delete video temp file IMMEDIATELY after upload to free disk space
    // before downloading the image (in case disk is tight)
    try {
      await fs.promises.unlink(videoTempPath);
      tempFiles.splice(tempFiles.indexOf(videoTempPath), 1);
      logger.info(`Cleaned up video temp file: ${videoTempPath}`);
    } catch (err: any) {
      logger.warn(`Failed to delete video temp file: ${err.message}`);
    }

    // ---------- 2. IMAGE ----------
    const imageKey = `feed/ansenterprise/${folderName}/${isrcs}.jpg`;
    let imageTempPath: string;

    try {
      imageTempPath = await downloadToTempFile(imageUrl, '.jpg');
      tempFiles.push(imageTempPath);
    } catch (error: any) {
      logger.error('Image download failed', {
        error: error.message,
        imageUrl,
        stack: error.stack,
      });
      throw new ApiError(500, `Image download failed: ${error.message}`);
    }

    try {
      await uploadFileFromDisk(imageTempPath, imageKey, 'image/jpeg');
    } catch (error: any) {
      logger.error('Image upload failed', {
        error: error.message,
        imageKey,
        stack: error.stack,
      });
      throw new ApiError(500, `Image upload failed: ${error.message}`);
    }

    // ---------- 3. XML MANIFEST ----------
    const xmlKey = `feed/ansenterprise/${folderName}/manifest.xml`;
    try {
      logger.info(`Uploading XML manifest: ${xmlKey}`);
      const result = await vevoS3
        .upload({
          Bucket: bucket,
          Key: xmlKey,
          Body: Buffer.from(xmlContent),
          ContentType: 'application/xml',
          ContentLength: Buffer.byteLength(xmlContent),
        })
        .promise();

      logger.info(`XML manifest upload complete: ${xmlKey}`, {
        location: result.Location,
        size: `${(Buffer.byteLength(xmlContent) / 1024).toFixed(2)} KB`,
      });

      return result;
    } catch (error: any) {
      logger.error('XML manifest upload failed', {
        error: error.message,
        stack: error.stack,
        xmlKey,
      });
      throw new ApiError(500, `XML manifest upload failed: ${error.message}`);
    }
  } finally {
    // Always clean up any remaining temp files
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) {
          await fs.promises.unlink(f);
          logger.info(`Cleaned up temp file: ${f}`);
        }
      } catch (err: any) {
        logger.warn(`Failed to delete temp file ${f}: ${err.message}`);
      }
    }
  }
};

// ============================================================
// STARTUP CLEANUP
// ============================================================
export const cleanupOrphanedVevoTempFiles = (): void => {
  try {
    if (!fs.existsSync(VEVO_TEMP_DIR)) return;

    const files = fs.readdirSync(VEVO_TEMP_DIR);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let cleaned = 0;

    for (const file of files) {
      if (!file.startsWith('vevo-')) continue;

      const filePath = path.join(VEVO_TEMP_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
          cleaned++;
          logger.info(`Cleaned up orphaned temp file: ${filePath}`);
        }
      } catch {
        // ignore
      }
    }

    if (cleaned > 0) {
      logger.info(
        `Startup cleanup: removed ${cleaned} orphaned VEVO temp files`,
      );
    }
  } catch (err: any) {
    logger.warn(`Startup temp cleanup failed: ${err.message}`);
  }
};
