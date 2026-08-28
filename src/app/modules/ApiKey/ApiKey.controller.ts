import { NextFunction, Request, Response } from 'express';
import { createError } from '../../../utils/error';
import { ApiKey } from './ApiKey.model';
import httpStatus from 'http-status';
import { generateAPIKey } from '../../../utils/utils';
import User from '../user/user.model';

export const createApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.body.companyName.user;

    const isExistUser = await User.findById(user);

    if (!isExistUser) {
      return next(createError(httpStatus.BAD_REQUEST, 'User is required'));
    }

    const existingKey = await ApiKey.findOne({ user });
    if (existingKey) {
      return next(
        createError(
          httpStatus.CONFLICT,
          'API key already exists for this company',
        ),
      );
    }

    const accessKey = generateAPIKey();

    const newApiKey = new ApiKey({
      companyName: isExistUser?.channelName,
      accessKey,
      user,
    });

    await newApiKey.save();

    res.status(httpStatus.CREATED).json({
      success: true,
      data: {
        companyName: isExistUser?.channelName,
        accessKey,
      },
    });
  } catch (err: any) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const getAllApiKeys = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const apiKeys = await ApiKey.find(
      {},
      'companyName accessKey createdAt',
    ).sort({ createdAt: -1 });

    res.status(httpStatus.OK).json({
      success: true,
      count: apiKeys.length,
      data: apiKeys,
    });
  } catch (err: any) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};

export const revokeApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findByIdAndDelete(id);

    if (!apiKey) {
      return next(createError(httpStatus.NOT_FOUND, 'API key not found'));
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (err: any) {
    next(createError(httpStatus.INTERNAL_SERVER_ERROR, err.message));
  }
};
