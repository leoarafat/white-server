import { Schema, model } from 'mongoose';
import { IPayment, IWithdraw } from './payments.interface';

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentRequest: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentRequest',
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['payment', 'withdrawal'],
      // required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      // required: true,
    },
    method: {
      type: String,
      enum: ['bank', 'bkash', 'cash', 'check', 'web-service'],
      required: true,
    },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'reject'],
      default: 'pending',
    },

    externalId: {
      type: String,
      // required: true,
    },
    vendorId: {
      type: String,
      // required: true,
    },
    associatedContact: {
      type: String,
      // required: true,
    },
    memo: {
      type: String,
      // required: true,
    },
  },
  {
    timestamps: true,
  },
);
const paymentRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    currentMonthBalance: {
      type: String,
      required: true,
    },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'reject'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);
const withdrawSchema = new Schema<IWithdraw>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
const amountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    revenueAdded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
export const Withdraw = model('Withdraw', withdrawSchema);
export const Amount = model('Amount', amountSchema);
export const Payment = model('Payment', paymentSchema);
export const PaymentRequest = model('PaymentRequest', paymentRequestSchema);
