import { Schema, model } from 'mongoose';
import { ILabel } from './label.interface';
import { attachStatusChangeHook } from '../notifications/notification.hooks';

const labelSchemaSchema = new Schema<ILabel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    labelId: {
      type: Number,
      required: true,
    },
    labelName: {
      type: String,
      required: true,
      sparse: true,
      unique: true,
    },
    youtubeChannel: {
      type: String,
    },
    youtubeUrl: {
      type: String,
    },
    avatar: {
      type: String,
    },
    banner: {
      type: String,
    },
    approvedStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

attachStatusChangeHook(labelSchemaSchema, 'label', {
  statusField: 'approvedStatus',
  titleField: 'labelName',
});

export const Label = model('Label', labelSchemaSchema);
