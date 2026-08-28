/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Request } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';
import { INews } from './news.interface';
import { News } from './news.model';
import { CustomRequest } from '../../../interfaces/common';

const createNews = async (req: CustomRequest) => {
  const payload = req.body as INews;
  const { files } = req;
  if (files?.image?.length) {
    payload.image = files.image[0].location;
  } else {
    //@ts-ignore
    delete payload.image;
  }

  return await News.create(payload);
};
const getNews = async (query: Record<string, unknown>) => {
  const accountQuery = new QueryBuilder(News.find(), query)
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
const deleteNews = async (req: Request) => {
  const { id } = req.params;
  return await News.findByIdAndDelete(id);
};

export const NewsService = {
  createNews,
  getNews,
  deleteNews,
};
