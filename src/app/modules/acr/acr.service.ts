// import axios from 'axios';
// import FormData from 'form-data';
// import crypto from 'crypto';
// import config from '../../../config';
// import { Request } from 'express';
// import { SingleTrack } from '../single-track/single.model';
// import ApiError from '../../../errors/ApiError';
// import { trimAudioBuffer } from './trimAudioBuffer';
// import { logger } from '../../../shared/logger';
// import { convertVideoToWav } from './convertVideoToWav';
// import { Video } from '../videos/videos.model';
// import { SongRecognition } from './acr.model';
// import PQueue from 'p-queue';
// import { downloadPartialVideoToTempFile } from './downloadVideoToTempFile';
// // import { downloadVideoToTempFile } from './downloadVideoToTempFile';
// const recognitionQueue = new PQueue({ concurrency: 3 });

// const recognizeMusic = async (audioBuffer: Buffer): Promise<any> => {
//   const host =
//     config.acr.host && config.acr.host.startsWith('http')
//       ? config.acr.host
//       : `https://${config.acr.host}`;

//   const configs = {
//     host: host,
//     access_key: config.acr.accessKey,
//     access_secret: config.acr.secretKey,
//     data_type: 'audio',
//     signature_version: 1,
//   };

//   const httpMethod = 'POST';
//   const httpURI = '/v1/identify';
//   const timestamp = Math.floor(Date.now() / 1000).toString();

//   const stringToSign = `${httpMethod}\n${httpURI}\n${configs.access_key}\n${configs.data_type}\n${configs.signature_version}\n${timestamp}`;

//   const signature = crypto
//     .createHmac('sha1', configs.access_secret as string)
//     .update(stringToSign)
//     .digest('base64');

//   const formData = new FormData();
//   formData.append('access_key', configs.access_key);
//   formData.append('data_type', configs.data_type);
//   formData.append('signature_version', configs.signature_version.toString());
//   formData.append('signature', signature);
//   formData.append('timestamp', timestamp);
//   formData.append('sample_bytes', audioBuffer.length.toString());
//   formData.append('sample', audioBuffer, {
//     filename: 'sample.wav',
//     contentType: 'audio/wav',
//   });

//   try {
//     const response = await axios.post(`${configs.host}${httpURI}`, formData, {
//       headers: formData.getHeaders(),
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//       timeout: 30000,
//     });

//     return response.data;
//   } catch (error: any) {
//     logger.error(
//       'ACRCloud Recognition Error:',
//       error.response ? error.response.data : error.message,
//     );
//     throw error;
//   }
// };

// const recognizeSong = async (req: Request) => {
//   const { id } = req.params;

//   try {
//     const isExist = await SongRecognition.findOne({ songId: id });

//     if (isExist) {
//       return {
//         success: true,
//         message: 'Recognition Successful',
//         data: isExist?.recognitionData,
//       };
//     }

//     const song = await SingleTrack.findById(id);
//     if (!song) {
//       throw new ApiError(404, 'Song not found');
//     }

//     const audioUrl = song.audio;

//     if (!audioUrl) {
//       throw new ApiError(400, 'Audio URL is missing');
//     }

//     const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
//     const audioBuffer = Buffer.from(response.data, 'binary');

//     if (audioBuffer.length === 0) {
//       throw new ApiError(400, 'Downloaded audio file is empty');
//     }

//     const trimmedBuffer = await trimAudioBuffer(audioBuffer, 0, 15);

//     const recognitionResult = await recognizeMusic(trimmedBuffer);

//     if (recognitionResult.status.code !== 0) {
//       return {
//         success: false,
//         message: 'ACRCloud Recognition Failed',
//         data: recognitionResult,
//       };
//     }

//     if (!isExist) {
//       const newRecognition = new SongRecognition({
//         songId: id,
//         recognitionData: recognitionResult,
//       });
//       await newRecognition.save();

//       return {
//         success: true,
//         message: 'Recognition Successful',
//         data: newRecognition?.recognitionData,
//       };
//     }
//   } catch (error: any) {
//     logger.error('Error in recognizeSong:', error.message);
//     throw error;
//   }
// };

// //! Worked code

// //!
// const recognizeVideoInternal = async (req: Request) => {
//   const { id } = req.params;

//   try {
//     const cached = await SongRecognition.findOne({ songId: id });
//     if (cached) {
//       return {
//         success: true,
//         message: 'Recognition Successful',
//         data: cached.recognitionData,
//       };
//     }

//     const video = await Video.findById(id);
//     if (!video || !video.video) throw new ApiError(404, 'Video not found');

//     // ✅ কেবল প্রথম 25 সেকেন্ড ডাউনলোড করো
//     const partialVideoPath = await downloadPartialVideoToTempFile(
//       video.video,
//       25,
//     );

//     // ✅ সেই অংশ থেকে অডিও বের করো (২০ সেকেন্ড পর্যন্ত কনভার্ট)
//     const wavBuffer = await convertVideoToWav(partialVideoPath, 20);

//     // ✂️ প্রথম ১৫ সেকেন্ড ট্রিম করে রিকগনিশন করো
//     const trimmedBuffer = await trimAudioBuffer(wavBuffer, 0, 15);
//     const recognitionResult = await recognizeMusic(trimmedBuffer);

//     if (recognitionResult.status.code !== 0) {
//       return {
//         success: false,
//         message: 'ACRCloud Recognition Failed',
//         data: recognitionResult,
//       };
//     }

//     const newRecognition = new SongRecognition({
//       songId: id,
//       recognitionData: recognitionResult,
//     });
//     await newRecognition.save();

//     return {
//       success: true,
//       message: 'Recognition Successful',
//       data: newRecognition.recognitionData,
//     };
//   } catch (error: any) {
//     logger.error('❌ Error in recognizeVideo:', error.message);
//     throw error;
//   }
// };

// const recognizeVideo = (req: Request) =>
//   recognitionQueue.add(() => recognizeVideoInternal(req));
// //!
// export const AcrService = {
//   recognizeSong,
//   recognizeVideo,
// };
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import crypto from 'crypto';
import config from '../../../config';
import { Request } from 'express';
import { SingleTrack } from '../single-track/single.model';
import ApiError from '../../../errors/ApiError';
import { trimAudioBuffer } from './trimAudioBuffer';
import { logger } from '../../../shared/logger';

import { Video } from '../videos/videos.model';
import { SongRecognition } from './acr.model';
import PQueue from 'p-queue';
import {
  downloadPartialVideoToTempFile,
  cleanupTempFile,
} from './downloadVideoToTempFile';

// ✅ Max 3 concurrent ACR recognitions at once — prevents /tmp flood
const recognitionQueue = new PQueue({ concurrency: 3 });

// ─────────────────────────────────────────────
// ACR Cloud API Call
// ─────────────────────────────────────────────
const recognizeMusic = async (audioBuffer: Buffer): Promise<any> => {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('recognizeMusic: audio buffer is empty');
  }

  const host =
    config.acr.host && config.acr.host.startsWith('http')
      ? config.acr.host
      : `https://${config.acr.host}`;

  const httpMethod = 'POST';
  const httpURI = '/v1/identify';
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const stringToSign = `${httpMethod}\n${httpURI}\n${config.acr.accessKey}\n${'audio'}\n${1}\n${timestamp}`;

  const signature = crypto
    .createHmac('sha1', config.acr.secretKey as string)
    .update(stringToSign)
    .digest('base64');

  const formData = new FormData();
  formData.append('access_key', config.acr.accessKey);
  formData.append('data_type', 'audio');
  formData.append('signature_version', '1');
  formData.append('signature', signature);
  formData.append('timestamp', timestamp);
  formData.append('sample_bytes', audioBuffer.length.toString());
  formData.append('sample', audioBuffer, {
    filename: 'sample.wav',
    contentType: 'audio/wav',
  });

  try {
    const response = await axios.post(`${host}${httpURI}`, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30_000,
    });
    return response.data;
  } catch (error: any) {
    logger.error(
      'ACRCloud API Error:',
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};

// ─────────────────────────────────────────────
// Recognize Song (Audio track)
// ─────────────────────────────────────────────
const recognizeSong = async (req: Request) => {
  const { id } = req.params;

  try {
    // ✅ Cache check — skip all processing if already done
    const isExist = await SongRecognition.findOne({ songId: id });
    if (isExist) {
      return {
        success: true,
        message: 'Recognition Successful',
        data: isExist.recognitionData,
      };
    }

    const song = await SingleTrack.findById(id);
    if (!song) throw new ApiError(404, 'Song not found');
    if (!song.audio) throw new ApiError(400, 'Audio URL is missing');

    // ✅ Download only — audio files are small, acceptable
    const response = await axios.get(song.audio, {
      responseType: 'arraybuffer',
      timeout: 30_000,
    });

    const audioBuffer = Buffer.from(response.data, 'binary');
    if (audioBuffer.length === 0) {
      throw new ApiError(400, 'Downloaded audio file is empty');
    }

    const trimmedBuffer = await trimAudioBuffer(audioBuffer, 0, 15);
    const recognitionResult = await recognizeMusic(trimmedBuffer);

    if (recognitionResult.status.code !== 0) {
      return {
        success: false,
        message: 'ACRCloud Recognition Failed',
        data: recognitionResult,
      };
    }

    const newRecognition = new SongRecognition({
      songId: id,
      recognitionData: recognitionResult,
    });
    await newRecognition.save();

    return {
      success: true,
      message: 'Recognition Successful',
      data: newRecognition.recognitionData,
    };
  } catch (error: any) {
    logger.error('Error in recognizeSong:', error.message);
    throw error;
  }
};

// ─────────────────────────────────────────────
// Recognize Video (core logic)
// ─────────────────────────────────────────────
const recognizeVideoInternal = async (req: Request) => {
  const { id } = req.params;

  // ✅ Track temp file path so we can ALWAYS clean it up
  let snippetPath: string | null = null;

  try {
    // ✅ Cache check — skip all ffmpeg work if already recognized
    const cached = await SongRecognition.findOne({ songId: id });
    if (cached) {
      return {
        success: true,
        message: 'Recognition Successful',
        data: cached.recognitionData,
      };
    }

    const video = await Video.findById(id);
    if (!video || !video.video) throw new ApiError(404, 'Video not found');

    // ✅ Stream directly from S3/URL → write only tiny WAV snippet
    // No full video download. /tmp usage: ~1-2MB instead of 500MB+
    snippetPath = await downloadPartialVideoToTempFile(video.video, 20);

    // ✅ Read the small WAV file into memory
    const wavBuffer = fs.readFileSync(snippetPath);
    if (wavBuffer.length === 0) {
      throw new ApiError(400, 'Audio extraction produced empty buffer');
    }

    // ✂️ Trim to 15 seconds for ACR Cloud fingerprinting
    const trimmedBuffer = await trimAudioBuffer(wavBuffer, 0, 15);

    // 🎵 Send to ACR Cloud
    const recognitionResult = await recognizeMusic(trimmedBuffer);

    if (recognitionResult.status.code !== 0) {
      return {
        success: false,
        message: 'ACRCloud Recognition Failed',
        data: recognitionResult,
      };
    }

    // ✅ Persist result so we never process this video again
    const newRecognition = new SongRecognition({
      songId: id,
      recognitionData: recognitionResult,
    });
    await newRecognition.save();

    return {
      success: true,
      message: 'Recognition Successful',
      data: newRecognition.recognitionData,
    };
  } catch (error: any) {
    logger.error('❌ Error in recognizeVideo:', error.message);
    throw error;
  } finally {
    // ✅ ALWAYS delete temp file — whether success, error, or timeout
    cleanupTempFile(snippetPath);
  }
};

// ✅ Queue wrapper — max 3 concurrent, rest wait in line
const recognizeVideo = (req: Request) =>
  recognitionQueue.add(() => recognizeVideoInternal(req));

export const AcrService = {
  recognizeSong,
  recognizeVideo,
};
