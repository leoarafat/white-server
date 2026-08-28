/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';

import { CustomRequest } from '../../../interfaces/common';
import { IBanner } from './banner.interface';
import { Banner } from './banner.model';

const createBanner = async (req: CustomRequest) => {
  const payload = req.body as IBanner;
  const { files } = req;
  if (files?.image?.length) {
    payload.image = files.image[0].location;
  } else {
    //@ts-ignore
    delete payload.image;
  }

  return await Banner.create(payload);
};
const getBanner = async (query: Record<string, unknown>) => {
  const accountQuery = new QueryBuilder(Banner.find(), query)
    .search(['title', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await accountQuery.modelQuery;
  const meta = await accountQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const deleteBanner = async (req: Request) => {
  const { id } = req.params;
  return await Banner.findByIdAndDelete(id);
};

export const BannerService = {
  createBanner,
  getBanner,
  deleteBanner,
};
