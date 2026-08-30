import { z } from 'zod';
import { objectId } from '../../../shared/zodCommon';

const transferByCsvSchema = z.object({
  body: z.object({
    toUserId: objectId('toUserId'),
  }),
});

const transferByIdsSchema = z.object({
  body: z.object({
    fromUserId: objectId('fromUserId'),
    toUserId: objectId('toUserId'),
    videoIds: z.array(objectId('videoId')).nonempty('videoIds are required'),
  }),
});

export const TransferOwnershipZodSchema = {
  transferByCsvSchema,
  transferByIdsSchema,
};
