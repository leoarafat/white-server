import { z } from 'zod';
import { requiredString } from '../../../shared/zodCommon';

const initiateUploadSchema = z.object({
  body: z.object({
    fileName: requiredString('fileName'),
    fileType: requiredString('fileType'),
    fileCategory: z.enum(['video', 'image'], {
      required_error: 'fileCategory is required',
    }),
  }),
});

const presignPartSchema = z.object({
  body: z.object({
    uploadId: requiredString('uploadId'),
    s3Key: requiredString('s3Key'),
    partNumber: z.number({ required_error: 'partNumber is required' }).int().positive(),
  }),
});

const completeUploadSchema = z.object({
  body: z.object({
    uploadId: requiredString('uploadId'),
    videoS3Key: requiredString('videoS3Key'),
    parts: z
      .array(
        z.object({
          PartNumber: z.number().int().positive(),
          ETag: requiredString('ETag'),
        }),
      )
      .nonempty('parts is required'),
    imageUrl: z.string().trim().optional(),
    videoData: z.record(z.any(), { required_error: 'videoData is required' }),
  }),
});

const abortUploadSchema = z.object({
  body: z.object({
    uploadId: requiredString('uploadId'),
    s3Key: requiredString('s3Key'),
  }),
});

export const ResumableUploadZodSchema = {
  initiateUploadSchema,
  presignPartSchema,
  completeUploadSchema,
  abortUploadSchema,
};
