// /* eslint-disable no-undef */

// import axios, { AxiosResponse } from 'axios';
// import AWS from 'aws-sdk';
// import httpStatus from 'http-status';
// import ApiError from '../../../errors/ApiError';
// import config from '../../../config';
// import { logger } from '../../../shared/logger';

// // Initialize S3 client with type-safe config
// const transferS3 = new AWS.S3({
//   region: config.transfer_s3.region,
//   accessKeyId: config.transfer_s3.accessKey,
//   secretAccessKey: config.transfer_s3.secretKey,
// });

// export type IVideoTransferResult = {
//   success: boolean;
//   message: string;
//   transferredKey?: string;
// };

// export const uploadFileToS3Transfer = async (
//   fileStream: NodeJS.ReadableStream,
//   key: string,
//   contentType: string,
// ): Promise<AWS.S3.ManagedUpload.SendData> => {
//   if (!config.transfer_s3.bucket) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       'S3 bucket configuration missing',
//     );
//   }

//   const uploadParams: AWS.S3.PutObjectRequest = {
//     Bucket: config.transfer_s3.bucket,
//     Key: key,
//     Body: fileStream,
//     ContentType: contentType,
//   };

//   try {
//     const result = await transferS3.upload(uploadParams).promise();
//     logger.info(`Upload success for ${key}`);
//     return result;
//   } catch (error) {
//     logger.error(`Error uploading file ${key} to S3`, error);
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Failed to upload file to S3',
//     );
//   }
// };

// export const downloadFileAsStream = async (
//   url: string,
// ): Promise<NodeJS.ReadableStream> => {
//   try {
//     const response: AxiosResponse<NodeJS.ReadableStream> = await axios.get(
//       url,
//       {
//         responseType: 'stream',
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//       },
//     );
//     return response.data;
//   } catch (error) {
//     logger.error(`Error downloading file from ${url}`, error);
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Failed to download source file',
//     );
//   }
// };

// export const constructDestinationKey = (originalUrl: string): string => {
//   const filename = originalUrl.split('/').pop();
//   if (!filename) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       'Invalid URL format - cannot extract filename',
//     );
//   }
//   return `sideload/ansenterprise/${filename}`;
// };
