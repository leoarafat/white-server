/* eslint-disable @typescript-eslint/ban-ts-comment */

import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import ApiError from '../../errors/ApiError';
import { Request, Response, NextFunction } from 'express';
import { s3Client } from '../../config/r2.config';
import config from '../../config';
import { generateArtistId } from '../../utils/uniqueId';

const multerUpload = multer({
  storage: multerS3({
    s3: s3Client,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    //@ts-ignore
    bucket: config.r2.bucketName,
    key: function (req: Request, file: any, cb: any) {
      let uploadPath = '';

      if (file.fieldname === 'nidFront' || file.fieldname === 'nidBack') {
        uploadPath = 'uploads/images/nid/';
      } else if (
        file.fieldname === 'dashboardScreenShot' ||
        file.fieldname === 'copyrightNoticeImage' ||
        file.fieldname === 'signature'
      ) {
        uploadPath = 'uploads/images/dashboard/';
      } else if (file.fieldname === 'video') {
        uploadPath = 'uploads/videos/';
      } else if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
        uploadPath = 'uploads/images/image/';
      } else if (file.fieldname === 'avatar') {
        uploadPath = 'uploads/images/image/';
      } else if (file.fieldname === 'banner') {
        uploadPath = 'uploads/images/image/';
      } else if (file.fieldname === 'audio') {
        uploadPath = 'uploads/audio/';
      } else if (file.fieldname === 'bulk') {
        uploadPath = 'uploads/bulk/';
      } else if (file.fieldname === 'statics') {
        uploadPath = 'uploads/statics/';
      } else if (file.fieldname === 'attachments') {
        uploadPath = 'uploads/chat/';
      } else {
        uploadPath = 'uploads/';
      }

      const clientId = generateArtistId();
      const fileNameParsed = path.parse(file.originalname);
      const cleanFileName =
        fileNameParsed.name.replace(/[^a-zA-Z0-9]/g, '') + fileNameParsed.ext;

      // Create the final file name
      const finalFileName = `${clientId}-${cleanFileName}`;
      cb(null, uploadPath + finalFileName);
    },
  }),
  fileFilter: function (req, file, cb) {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/vnd.wave',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/webm',
      'video/ogg',
      'video/mpeg',
      'video/3gpp',
      'video/x-matroska',
      'text/csv',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Added
      'application/vnd.ms-excel', // Optional: For older Excel formats
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/gif',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type'));
    }
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'bulk', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'nidFront', maxCount: 1 },
  { name: 'nidBack', maxCount: 1 },
  { name: 'dashboardScreenShot', maxCount: 1 },
  { name: 'copyrightNoticeImage', maxCount: 1 },
  { name: 'statics', maxCount: 5 },
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]);

// R2's S3 API endpoint isn't publicly readable — multer-s3 builds `.location`
// from it by default, so rewrite every uploaded file's location to the R2
// public URL (custom domain / r2.dev) before it reaches route handlers.
export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  multerUpload(req, res, (err: any) => {
    if (err) return next(err);

    const publicBase = config.r2.publicUrl?.replace(/\/$/, '');
    if (publicBase && req.files) {
      Object.values(req.files as Record<string, any[]>).forEach(fileArr => {
        fileArr.forEach(file => {
          if (file.key) {
            file.location = `${publicBase}/${file.key}`;
          }
        });
      });
    }
    next();
  });
};
