import { IUser } from '../user/user.interface';
import { Types } from 'mongoose';
type IIsrc = {
  isrc: string;
  user: Types.ObjectId | IUser;
};

import mongoose, { Schema, model } from 'mongoose';

const IsrcSchema = new Schema<IIsrc>({
  isrc: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export const Isrc = model<IIsrc>('isrcprefix', IsrcSchema);
