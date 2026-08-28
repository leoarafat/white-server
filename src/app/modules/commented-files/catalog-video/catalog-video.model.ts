import { Schema, model, Types } from 'mongoose';

export type ICorrection = {
  contentId: Types.ObjectId;
  user: Types.ObjectId;
  message: string;
  title: string;
};

const CorrectionContentSchema = new Schema<ICorrection>({
  contentId: {
    type: Schema.Types.ObjectId,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
});

export const CorrectionVideoContent = model<ICorrection>(
  'CorrectionVideoContent',
  CorrectionContentSchema,
);
