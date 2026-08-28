/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';

import { StoredCountry } from './stored-country.model';
import { IStoredCountry } from './stored-country.interface';

const addSongInCountry = async (req: Request) => {
  const { selectedCountryDetails, removedCountryDetails } = req.body as {
    selectedCountryDetails: IStoredCountry[];
    removedCountryDetails: IStoredCountry[];
  };

  try {
    const results = [];

    const bulkAddOps = selectedCountryDetails.map(data => ({
      updateOne: {
        filter: { countryName: data.countryName, contentId: data.contentId },
        update: { $set: data },
        upsert: true,
      },
    }));

    if (bulkAddOps.length > 0) {
      const bulkAddResult = await StoredCountry.bulkWrite(bulkAddOps);
      //@ts-ignore
      results.push(...(bulkAddResult.result.upserted || []));
    }

    const bulkRemoveOps = removedCountryDetails.map(data => ({
      deleteOne: {
        filter: { countryName: data.countryName, contentId: data.contentId },
      },
    }));

    let deletedCount = 0;
    if (bulkRemoveOps.length > 0) {
      const bulkRemoveResult = await StoredCountry.bulkWrite(bulkRemoveOps);
      deletedCount = bulkRemoveResult.deletedCount || 0;
    }

    return { success: true, data: { upserted: results, deletedCount } };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      errorMessages: [{ path: '', message: error.message }],
      stack: error.stack,
    };
  }
};

const getCountryBySong = async (id: string) => {
  const result = await StoredCountry.find({ contentId: id });
  return result;
};

const updateCountryForSong = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  return await StoredCountry.findByIdAndUpdate(
    id,
    { ...data },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const CountryService = {
  addSongInCountry,
  getCountryBySong,
  updateCountryForSong,
};
