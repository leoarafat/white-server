import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { IReqUser } from '../../../interfaces/common';
import { IGenericResponse } from '../../../interfaces/paginations';
import QueryBuilder from '../../../builder/QueryBuilder';
import {
  IBankAccount,
  IMobileBankAccount,
  IPioneerAccount,
} from './account.interface';
import {
  BankAccount,
  MobileBankAccount,
  PioneerAccount,
} from './account.model';
import User from '../user/user.model';

const addBankAccount = async (user: IReqUser, payload: IBankAccount) => {
  const findUser = await User.findById(user?.userId);
  if (!findUser) {
    throw new ApiError(404, 'user not found');
  }
  if (!payload.accountName || !payload.accountNumber || !payload.bankName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All field are required');
  }
  const checkExistAccount = await BankAccount.findOne({ user: user?.userId });
  if (checkExistAccount) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already a account');
  }
  payload.user = user?.userId;
  payload.userId = findUser?.clientId;
  return await BankAccount.create(payload);
};
const addMobileBankAccount = async (
  user: IReqUser,
  payload: IMobileBankAccount,
) => {
  const findUser = await User.findById(user?.userId);
  if (!findUser) {
    throw new ApiError(404, 'user not found');
  }

  if (!payload.accountName || !payload.accountNumber || !payload.providerName) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All field are required');
  }
  const checkExistAccount = await MobileBankAccount.findOne({
    user: user?.userId,
  });
  if (checkExistAccount) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already a account');
  }
  payload.user = user?.userId;
  payload.userId = findUser?.clientId;
  return await MobileBankAccount.create(payload);
};
const addPioneerAccount = async (user: IReqUser, payload: IPioneerAccount) => {
  const findUser = await User.findById(user?.userId);
  if (!findUser) {
    throw new ApiError(404, 'user not found');
  }
  if (!payload.accountNumber || !payload.email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All field are required');
  }
  const checkExistAccount = await PioneerAccount.findOne({
    user: user?.userId,
  });
  if (checkExistAccount) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You have already a account');
  }
  payload.user = user?.userId;
  payload.userId = findUser?.clientId;
  return await PioneerAccount.create(payload);
};
const getAllMobileBankAccount = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IMobileBankAccount[]>> => {
  const accountQuery = new QueryBuilder(
    MobileBankAccount.find().populate('user'),
    query,
  )
    .search(['accountNumber', 'userId'])
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
const getAllPioneerAccount = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IPioneerAccount[]>> => {
  const accountQuery = new QueryBuilder(
    PioneerAccount.find().populate('user'),
    query,
  )
    .search(['accountName', 'accountNumber', 'userId'])
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
const getAllBankAccount = async (
  query: Record<string, unknown>,
): Promise<IGenericResponse<IBankAccount[]>> => {
  const accountQuery = new QueryBuilder(
    BankAccount.find().populate('user'),
    query,
  )
    .search(['accountName', 'accountNumber', 'userId'])
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
const myAccount = async (user: IReqUser) => {
  const bankAccount = await BankAccount.findOne({ user: user?.userId });
  const mobileBankAccountAccount = await MobileBankAccount.findOne({
    user: user?.userId,
  });
  const pioneerAccount = await PioneerAccount.findOne({ user: user?.userId });
  return {
    bankAccount,
    mobileBankAccountAccount,
    pioneerAccount,
  };
};
//!
const updates = async (
  id: string,
  payload: Partial<IBankAccount | IMobileBankAccount | IPioneerAccount>,
) => {
  const bankAccount = await BankAccount.findOne({ _id: id });

  const mobileBankAccountAccount = await MobileBankAccount.findOne({
    _id: id,
  });
  const pioneerAccount = await PioneerAccount.findOne({ _id: id });

  if (bankAccount) {
    const { ...data } = payload;
    return await BankAccount.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
  if (mobileBankAccountAccount) {
    const { ...data } = payload;
    return await MobileBankAccount.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
  if (pioneerAccount) {
    const { ...data } = payload;
    return await PioneerAccount.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
};
//!
const deleteAccount = async (id: string) => {
  const bankAccount = await BankAccount.findOne({ _id: id });
  const mobileBankAccountAccount = await MobileBankAccount.findOne({
    _id: id,
  });
  const pioneerAccount = await PioneerAccount.findOne({ _id: id });

  if (bankAccount) {
    return await BankAccount.findByIdAndDelete(id);
  }
  if (mobileBankAccountAccount) {
    return await MobileBankAccount.findByIdAndDelete(id);
  }
  if (pioneerAccount) {
    return await PioneerAccount.findByIdAndDelete(id);
  }
};
export const AccountService = {
  addBankAccount,
  addMobileBankAccount,
  addPioneerAccount,
  getAllBankAccount,
  getAllMobileBankAccount,
  getAllPioneerAccount,
  myAccount,
  updates,
  deleteAccount,
};
