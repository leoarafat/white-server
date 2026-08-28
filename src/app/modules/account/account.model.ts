import { Schema, model } from 'mongoose';
import {
  IBankAccount,
  IMobileBankAccount,
  IPioneerAccount,
} from './account.interface';

const bankAccountSchema = new Schema<IBankAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    branchName: {
      type: String,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);
const mobileBankAccountSchema = new Schema<IMobileBankAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
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
  },
  {
    timestamps: true,
  },
);
const pioneerSchema = new Schema<IPioneerAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
export const BankAccount = model('BankAccount', bankAccountSchema);
export const MobileBankAccount = model(
  'MobileBankAccount',
  mobileBankAccountSchema,
);
export const PioneerAccount = model('PioneerAccount', pioneerSchema);
