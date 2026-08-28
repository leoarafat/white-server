// src/shared/ffmpegConfig.ts
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { logger } from '../shared/logger';

// Set FFmpeg and FFprobe paths
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

// Log the paths for verification
logger.info(`FFmpeg Path set to: ${ffmpegInstaller.path}`);
logger.info(`FFprobe Path set to: ${ffprobeStatic.path}`);

export default ffmpeg;
