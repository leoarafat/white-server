import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { CountryService } from './stored-country.service';

const addSongInCountry = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryService.addSongInCountry(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country add successful',
    data: result,
  });
});

const getCountryBySong = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryService.getCountryBySong(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country retrieved successful',
    data: result,
  });
});
const updateCountryForSong = catchAsync(async (req: Request, res: Response) => {
  const result = await CountryService.updateCountryForSong(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Country update successful',
    data: result,
  });
});

export const CountryController = {
  addSongInCountry,
  getCountryBySong,
  updateCountryForSong,
};
