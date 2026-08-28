import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import config from '../../../config';
import { s3Client } from '../../../config/r2.config';
import ApiError from '../../../errors/ApiError';

export const downloadFileFromS3 = async (key: string): Promise<Buffer> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    throw new ApiError(500, 'Error downloading file from S3');
  }
};
