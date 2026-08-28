/* eslint-disable @typescript-eslint/ban-ts-comment */
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import User from '../user/user.model';
import { IPayment } from './payments.interface';
import { Amount, Payment, PaymentRequest, Withdraw } from './payments.model';

import sendEmail from '../../../utils/sendEmail';
import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import { paymentReceivedEmailBody } from './payment.mail';
import { logger } from '../../../shared/logger';
import { Request } from 'express';
import QueryBuilder from '../../../builder/QueryBuilder';
import { IReqUser } from '../../../interfaces/common';
import { paymentRequestEmailBody } from './payment.request';
import mongoose from 'mongoose';
import { UserBalance } from '../user-balance/UserBalance.model';

const RequestForPayment = async (req: Request) => {
  const payload = req.body;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  const currentYear = currentDate.getFullYear();

  const isExistUser = await User.findById(req.user?.userId);
  if (!isExistUser) {
    throw new ApiError(404, 'Sender user not found');
  }
  const isExist = await PaymentRequest.findOne({
    $and: [
      { user: req.user?.userId },
      { approvedStatus: 'pending' },
      { year: currentYear },
      { month: currentMonth },
    ],
  });
  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Your previous request still pending',
    );
  }

  payload.user = req.user?.userId;
  const result = await PaymentRequest.create({
    ...payload,
    month: currentMonth,
    year: currentYear,
  });

  try {
    sendEmail({
      email: 'support@ansmusiclimited.com',
      subject: 'New Payment Received',
      html: paymentRequestEmailBody({
        name: isExistUser?.name,
        providerName: payload?.providerName,
      }),
    });
  } catch (error: any) {
    throw new ApiError(500, `${error.message}`);
  }
  return result;
};
const makePayment = async (req: Request) => {
  const userId = req.body.user;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  const currentYear = currentDate.getFullYear();
  const paymentPayload = {
    ...req.body,
    user: userId,
  };
  const isExistMyBalance = await UserBalance.findOne({ user: userId });
  if (!isExistMyBalance) {
    throw new ApiError(400, 'No balance record found for this user');
  }

  // NOTE: session.withTransaction() commits automatically on success and
  // aborts automatically on error (and retries transient transaction
  // errors) — do NOT manually call commitTransaction/abortTransaction
  // around it. Doing so caused "Cannot call abortTransaction twice" on
  // every failed payment, masking the real error.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const isExistAmount = await Amount.findOne({
        $and: [
          { user: userId },
          { year: currentYear },
          { month: currentMonth },
        ],
      });

      if (isExistAmount) {
        isExistAmount.amount -= req.body.amount;
        await isExistAmount.save({ session });
      }

      const result = await Payment.create([paymentPayload], { session });

      isExistMyBalance.balance =
        (isExistMyBalance.balance || 0) - Number(req.body.amount);

      await isExistMyBalance.save({ session });

      const paymentRequestUpdate = await PaymentRequest.findOneAndUpdate(
        { _id: req.body?.paymentRequest },
        { approvedStatus: 'approved' },
        { new: true, session },
      );

      if (!paymentRequestUpdate) {
        throw new ApiError(404, 'Payment request not found');
      }

      const findUser = await User.findById(userId);

      if (!findUser) {
        throw new ApiError(404, 'User not found');
      }

      const data = {
        name: findUser.name,
        transactionId: result[0].transactionId,
        method: result[0].method,
        amount: result[0].amount,
        enterDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
      };

      try {
        await sendEmail({
          email: findUser.email,
          subject: 'Payment request is approved',
          //@ts-ignore
          html: paymentReceivedEmailBody(data),
        });
      } catch (error: any) {
        throw new ApiError(500, `Email sending failed: ${error.message}`);
      }
    });
  } finally {
    await session.endSession();
  }

  const result = await Payment.findOne(paymentPayload);
  return result;
};
const paymentRequestsLists = async (
  status: string,
  query: Record<string, unknown>,
) => {
  const paymentQuery = new QueryBuilder(
    PaymentRequest.find({ approvedStatus: status })
      .populate('user')
      .populate('bankId'),
    query,
  )
    .search(['createdAt', 'clientId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await paymentQuery.modelQuery;
  const meta = await paymentQuery.countTotal();

  return {
    meta,
    data: result,
  };
};

const isExistPayment = async (req: Request) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;

  const currentYear = currentDate.getFullYear();

  const isExistUser = await User.findById(req.user?.userId);
  if (!isExistUser) {
    throw new ApiError(404, 'Sender user not found');
  }
  const isExist = await PaymentRequest.findOne({
    $and: [
      { user: req.user?.userId },
      { approvedStatus: 'pending' },
      { year: currentYear },
      { month: currentMonth },
    ],
  });
  if (isExist) {
    return true;
  } else {
    return false;
  }
};
const withdrawAmount = async (payload: IPayment) => {
  try {
    const { user, amount } = payload;
    const currentUser = await User.findOne({ _id: user });
    if (!currentUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found');
    }
    if (currentUser.balance < amount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
    }
    currentUser.balance -= amount;
    await currentUser.save();
    return await Withdraw.create(payload);
  } catch (error) {
    throw new ApiError(
      //@ts-ignore
      error.status || httpStatus.INTERNAL_SERVER_ERROR,
      //@ts-ignore
      error.message || 'Withdrawal failed',
    );
  }
};
const totalPayments = async () => {
  const payments = await Payment.find({});

  let totalAmount = 0;

  for (const payment of payments) {
    if (payment.amount && typeof payment.amount === 'number') {
      totalAmount += payment.amount;
    } else {
      logger.warn(`Invalid amount found for payment ID: ${payment._id}`);
    }
  }

  return {
    totalPayments: payments.length,
    paymentUser: payments,
    totalAmount: totalAmount,
  };
};

const totalTransaction = async () => {
  const payments = await Payment.find({});
  const totalPayment = payments.reduce((acc, price) => {
    return acc + price.amount;
  }, 0);

  return {
    totalPayments: totalPayment,
    paymentUser: payments,
  };
};
const deleteTransaction = async (id: string) => {
  const isExist = await Payment.findById(id);
  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }
  return await Payment.findByIdAndDelete(id);
};
const userForPayment = async () => {
  try {
    const approvedSingleSongs = await SingleTrack.find({
      isApproved: 'approved',
    }).populate('user');
    const approvedAlbumSongs = await Album.find({
      isApproved: 'approved',
    }).populate('user');

    // Extract users from single tracks and albums
    const singleTrackUsers = approvedSingleSongs.map(song => song.user);
    const albumUsers = approvedAlbumSongs.map(album => album.user);

    // Merge all users into one array
    const allUsers = [...singleTrackUsers, ...albumUsers];

    return {
      allUsers,
      approvedSingleSongs,
      approvedAlbumSongs,
    };
  } catch (error) {
    logger.error('Error fetching approved songs for payment:', error);
    throw error; // Rethrow the error for handling in the calling function
  }
};
const rejectPayment = async (payload: { paymentId: string }) => {
  return await PaymentRequest.findByIdAndUpdate(
    payload.paymentId,
    { approvedStatus: 'reject' },
    { new: true, runValidators: true },
  );
};
const myTransactions = async (req: Request) => {
  const { userId } = req.user as IReqUser;
  const query = req.query;
  // const test = await Payment.find({ user: userId });

  const transaction = new QueryBuilder(
    Payment.find({
      user: userId,
    })
      .populate('user')
      .lean(),
    query,
  )
    .search(['transactionId'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await transaction.modelQuery;
  const meta = await transaction.countTotal();

  return {
    meta,
    data: result,
  };
};
const paymentDetails = async (id: string) => {
  return await Payment.findOne({ paymentRequest: id });
};

const addBalanceFromAdmin = async (req: Request) => {
  const currentDate = new Date();
  const currentMonthNumber = currentDate.getMonth() + 1;
  const currentMonth = currentMonthNumber - 1 || 12;

  const currentYear = currentDate.getFullYear();
  const { userId, amount } = req.body;
  let existAmount = await Amount.findOne({ user: userId });

  if (!existAmount) {
    existAmount = new Amount({
      user: userId,
      year: currentYear,
      month: currentMonth,
      amount: 0,
    });
  }
  existAmount.amount = (existAmount.amount || 0) + Number(amount);

  await existAmount.save();

  return existAmount;
};
const removeBalanceFromAdmin = async (req: Request) => {
  const { userId, amount } = req.body;

  const existAmount = await Amount.findOne({ user: userId });
  if (!existAmount) {
    throw new ApiError(400, 'No balance record found for this user');
  }
  const currentBalance = existAmount.amount || 0;
  if (currentBalance < amount) {
    throw new ApiError(
      400,
      `Cannot remove $${amount}. Current balance is $${currentBalance}.`,
    );
  }

  existAmount.amount = currentBalance - Number(amount);
  await existAmount.save();
  return existAmount;
};
export const paymentService = {
  makePayment,
  withdrawAmount,
  totalPayments,
  totalTransaction,
  deleteTransaction,
  userForPayment,
  RequestForPayment,
  paymentRequestsLists,
  rejectPayment,
  myTransactions,
  paymentDetails,
  isExistPayment,
  addBalanceFromAdmin,
  removeBalanceFromAdmin,
};
