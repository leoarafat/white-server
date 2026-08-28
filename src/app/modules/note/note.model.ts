import { Schema, model } from 'mongoose';
import { INote } from './note.interface';

const noteSchema = new Schema<INote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Note = model('Note', noteSchema);
