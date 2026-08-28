/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import { IStore } from './sotre.interface';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { Store } from './sotre.model';
import { IGenericResponse } from '../../../interfaces/paginations';
import QueryBuilder from '../../../builder/QueryBuilder';
import { generateArtistId } from '../../../utils/uniqueId';

const addStore = async (req: Request) => {
  const data = req.body as IStore;
  const { title, link } = data;
  const { files } = req;
  //@ts-ignore
  if (!files?.image?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Image is required');
  }
  let image = undefined;
  //@ts-ignore
  if (files?.image) {
    //@ts-ignore
    image = `${files?.image[0].location}`;
  }
  if (!title || !link) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title and Link is missing');
  }
  const storeId = generateArtistId();
  const payload = {
    storeId,
    title,
    link,
    image,
  };
  return await Store.create(payload);
};
const getStores = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IStore[]>> => {
  const storeQuery = new QueryBuilder(Store.find({}), query)
    .search(['title'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await storeQuery.modelQuery;
  const meta = await storeQuery.countTotal();

  return {
    meta,
    data: result,
  };
};
const getSingle = async (id: string) => {
  const isExists = await Store.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Store not found');
  }
  return isExists;
};
const updates = async (req: Request) => {
  const { id } = req.params;
  const { files } = req;
  const { ...data } = req.body;

  //@ts-ignore
  if (files?.image) {
    //@ts-ignore
    data.image = `${files?.image[0].location}`;
  }
  const isExists = await Store.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Store not found');
  }

  return await Store.findByIdAndUpdate(
    id,
    { ...data },
    {
      new: true,
      runValidators: true,
    },
  );
};
const deleteStore = async (id: string) => {
  const isExists = await Store.findById(id);
  if (!isExists) {
    throw new ApiError(404, 'Store not found');
  }
  return await Store.findByIdAndDelete(id);
};
export const StoreService = {
  addStore,
  getStores,
  getSingle,
  updates,
  deleteStore,
};
