import { Request, Response } from 'express';
import { getUserISRC } from '../statics/isrcs';

import { Mutex } from 'async-mutex';
import { logger } from '../../../shared/logger';
import { Isrc } from './isrc.model';
import ApiError from '../../../errors/ApiError';
import mongoose from 'mongoose';

const isrcMutex = new Mutex();
export const generateIsrc = async (req: Request, res: Response) => {
  await isrcMutex.runExclusive(async () => {
    try {
      const userISRCs = await getUserISRC();

      // Filter valid ISRCs only
      const validISRCs = userISRCs.filter((isrc: string) =>
        /^QT6X6\d{7}$/.test(isrc.trim()),
      );

      let newISRC: string;

      if (validISRCs.length === 0) {
        newISRC = 'QT6X62500001';
      } else {
        // Sort ISRCs and get the highest one
        const sorted = validISRCs.sort((a, b) => {
          const aNum = parseInt(a.slice(-7));
          const bNum = parseInt(b.slice(-7));
          return aNum - bNum;
        });

        const lastISRC = sorted[sorted.length - 1];
        const numericPart = parseInt(lastISRC.slice(-7), 10);
        const nextNumber = numericPart + 1;
        newISRC = `QT6X6${nextNumber.toString().padStart(7, '0')}`;
      }

      res.status(200).json({
        success: true,
        data: newISRC,
      });
    } catch (error) {
      logger.error('Error generating ISRC:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate ISRC',
      });
    }
  });
};
// export const generateIsrc = async (req: Request, res: Response) => {
//   await isrcMutex.runExclusive(async () => {
//     try {
//       const userISRCs = await getUserISRC();

//       // Filter valid ISRCs only
//       const validISRCs = userISRCs.filter((isrc: string) =>
//         /^BDA1M\d{7}$/.test(isrc.trim()),
//       );

//       let newISRC: string;

//       if (validISRCs.length === 0) {
//         newISRC = 'QT6X62500001';
//       } else {
//         // Sort ISRCs and get the highest one
//         const sorted = validISRCs.sort((a, b) => {
//           const aNum = parseInt(a.slice(-7));
//           const bNum = parseInt(b.slice(-7));
//           return aNum - bNum;
//         });

//         const lastISRC = sorted[sorted.length - 1];
//         const numericPart = parseInt(lastISRC.slice(-7), 10);
//         const nextNumber = numericPart + 1;
//         newISRC = `QT6X6${nextNumber.toString().padStart(7, '0')}`;
//       }

//       res.status(200).json({
//         success: true,
//         data: newISRC,
//       });
//     } catch (error) {
//       logger.error('Error generating ISRC:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to generate ISRC',
//       });
//     }
//   });
// };

export const createIsrc = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const objectId = new mongoose.Types.ObjectId(data?.data?.userId);

    // Validation
    if (!data?.data?.isrc.trim()) {
      throw new ApiError(400, 'ISRC data is required');
    }

    // Check existence
    const existingIsrc = await Isrc.findOne({
      user: objectId,
      isrc: data?.data?.isrc,
    });
    if (existingIsrc) {
      throw new ApiError(409, 'ISRC already exists for this user'); // 409 Conflict
    }

    // Create
    const newIsrc = await Isrc.create({
      user: objectId,
      isrc: data?.data?.isrc?.trim().toUpperCase(), // Normalize input
    });

    // Success response
    return res.status(201).json({
      success: true,
      message: 'ISRC created successfully',
      data: {
        id: newIsrc._id,
        isrc: newIsrc.isrc,
        user: newIsrc.user,
      },
    });
  } catch (error: any) {
    logger.error('Error creating ISRC:', error);

    // If it's our custom ApiError, use its status and message
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
      });
    }

    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
export const isExistPrefix = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    const isExistIsrc = await Isrc.findOne({ user: objectId });

    return res.status(200).json({
      success: true,
      exists: !!isExistIsrc,
      data: isExistIsrc || null,
    });
  } catch (error: any) {
    logger.error('Error checking ISRC prefix existence:', error);

    // Send error response instead of throwing
    return res.status(500).json({
      success: false,
      message: 'Failed to check ISRC prefix existence',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
