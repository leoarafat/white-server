/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
// import excelToJson from 'convert-excel-to-json';
import { Bulk } from './bulk.model';
import ApiError from '../../../errors/ApiError';
import { parseExcel } from './parseExcel';
import { downloadFileFromS3 } from './downloadFileFromS3';
import { mapDataToVideos } from './mapping.utils';
import { Video } from '../videos/videos.model';
import { logger } from '../../../shared/logger';
import mongoose from 'mongoose';

//!
// const createBulk = async (req: Request) => {
//   //@ts-ignore
//   if (!req.files || !req.files['bulk']) {
//     throw new ApiError(400, 'No bulk files uploaded');
//   }

//   //@ts-ignore
//   const bulks = req.files['bulk'];

//   const bulkFile = bulks[0];
//   const filename = bulks[0].originalname;
//   const size = bulks[0].size;
//   const fileBuffer = await downloadFileFromS3(bulkFile.key);

//   const excelData = parseExcel(fileBuffer);

//   const videoDocs = await mapDataToVideos(excelData);

//   if (videoDocs.length === 0) {
//     throw new ApiError(400, 'No valid videos to upload');
//   }

//   const savedVideos = await Video.insertMany(videoDocs, { ordered: false });
//   if (savedVideos) {
//     await Bulk.create({
//       fileName: filename,
//       size,
//     });
//   }
//   return savedVideos;
// };
//!
const createBulk = async (req: Request) => {
  //@ts-ignore
  if (!req.files || !req.files['bulk']) {
    throw new ApiError(400, 'No bulk files uploaded');
  }

  //@ts-ignore
  const bulks = req.files['bulk'];
  const bulkFile = bulks[0];
  const filename = bulks[0].originalname;
  const size = bulks[0].size;
  const fileBuffer = await downloadFileFromS3(bulkFile.key);

  const excelData = parseExcel(fileBuffer);
  const videoDocs = await mapDataToVideos(excelData);

  if (videoDocs.length === 0) {
    throw new ApiError(400, 'No valid videos to upload');
  }

  // 🔹 Start MongoDB Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 🔹 Insert videos using the transaction
    const savedVideos = await Video.insertMany(videoDocs, {
      session,
      ordered: true,
    });

    // 🔹 Insert bulk metadata (only if videos insert successfully)
    await Bulk.create([{ fileName: filename, size }], { session });

    // 🔹 Commit transaction (finalize changes)
    await session.commitTransaction();
    session.endSession();

    return savedVideos;
  } catch (error) {
    // 🔹 Rollback all operations if something fails
    await session.abortTransaction();
    session.endSession();

    logger.error('Transaction failed:', error);
    throw new ApiError(500, 'Bulk upload failed. Changes rolled back.');
  }
};
const getBulkData = async () => {
  const result = await Bulk.find({}).lean();

  return result;
};
export const bulkService = { createBulk, getBulkData };
