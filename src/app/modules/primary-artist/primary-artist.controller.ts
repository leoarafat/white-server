import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { PrimaryArtistService } from './primary-artist.service';
import { resolveOwnerContext } from '../../../shared/subUserAccess';

const updatePrimaryArtist = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any;
  if (files?.image?.[0]?.location) {
    data.image = files.image[0].location;
  }
  const result = await PrimaryArtistService.updatePrimaryArtist(id, owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist update successful!',
    data: result,
  });
});

const addPrimaryArtist = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any;
  if (files?.image?.[0]?.location) {
    data.image = files.image[0].location;
  }
  const result = await PrimaryArtistService.addPrimaryArtist(owner, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist added successful!',
    data: result,
  });
});
const getArtistsByIds = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await PrimaryArtistService.getArtistsByIds(data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist retrieved successful!',
    data: result,
  });
});
const allArtist = catchAsync(async (req: Request, res: Response) => {
  const result = await PrimaryArtistService.allArtist();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist retrieved successful!',
    data: result,
  });
});
const getFeatureArtistsByIds = catchAsync(
  async (req: Request, res: Response) => {
    const data = req.body;

    const result = await PrimaryArtistService.getFeatureArtistsByIds(data);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Artist retrieved successful!',
      data: result,
    });
  },
);
const getPrimaryArtist = catchAsync(async (req: Request, res: Response) => {
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await PrimaryArtistService.getPrimaryArtist(owner, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist retrieved successful!',
    data: result.data,
    meta: result.meta,
  });
});
const deletePrimaryArtist = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const owner = req.ownerContext ?? (await resolveOwnerContext(req.user as JwtPayload));
  const result = await PrimaryArtistService.deletePrimaryArtist(id, owner);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist retrieved successful!',
    data: result,
  });
});
const artistByUserId = catchAsync(async (req: Request, res: Response) => {
  const result = await PrimaryArtistService.artistByUserId(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Artist retrieved successful!',
    data: result,
  });
});
export const PrimaryArtistController = {
  updatePrimaryArtist,
  addPrimaryArtist,
  getPrimaryArtist,
  deletePrimaryArtist,
  getArtistsByIds,
  getFeatureArtistsByIds,
  artistByUserId,
  allArtist,
};
