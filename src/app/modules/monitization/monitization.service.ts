/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { IReqUser } from '../../../interfaces/common';
import { Monetization } from './monitization.model';
import { IMonetization } from './monitization.interface';

const createMonetization = async (user: IReqUser, payload: IMonetization) => {
  const isExist = await Monetization.findOne({
    $and: [{ user: user?.userId }, { status: 'Pending' }],
  });

  if (isExist) {
    throw new ApiError(
      400,
      'Your previous request still Pending. Please wait until response.',
    );
  }
  return await Monetization.create({ ...payload, user: user?.userId });
};

const getMyMonetization = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const MonetizationQuery = new QueryBuilder(
    Monetization.find({
      user: user?.userId,
    }).lean(),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MonetizationQuery.modelQuery;

  const meta = await MonetizationQuery.countTotal();
  return {
    meta,
    data: result,
  };
};

// This will be use for update, approve and reject
const updateMonetization = async (id: string, payload: any) => {
  const checkIsExist = await Monetization.findById(id).populate('user');
  if (!checkIsExist) {
    throw new ApiError(404, 'Monetization not found');
  }
  const { ...MonetizationData } = payload;

  const result = await Monetization.findOneAndUpdate(
    { _id: id },
    MonetizationData,
    {
      new: true,
      runValidators: true,
    },
  );

  return result;
};
const getPendingMonetization = async (query: Record<string, unknown>) => {
  const MonetizationQuery = new QueryBuilder(
    Monetization.find({ status: 'Pending' }).lean(),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MonetizationQuery.modelQuery;
  const meta = await MonetizationQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getApprovedMonetization = async (query: Record<string, unknown>) => {
  const MonetizationQuery = new QueryBuilder(
    Monetization.find({ status: 'Approved' }).lean(),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MonetizationQuery.modelQuery;
  const meta = await MonetizationQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getRejectedMonetization = async (query: Record<string, unknown>) => {
  const MonetizationQuery = new QueryBuilder(
    Monetization.find({ status: 'Rejected' }).lean(),
    query,
  )
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MonetizationQuery.modelQuery;
  const meta = await MonetizationQuery.countTotal();
  return {
    meta,
    data: result,
  };
};

export const MonetizationService = {
  createMonetization,
  updateMonetization,
  getMyMonetization,
  getPendingMonetization,
  getApprovedMonetization,
  getRejectedMonetization,
};
