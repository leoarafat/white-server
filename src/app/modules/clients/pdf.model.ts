import { Schema, model } from 'mongoose';

const pdfSchema = new Schema(
  {
    pdf: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PDF = model('PDF', pdfSchema);
