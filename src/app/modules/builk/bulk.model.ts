import mongoose from 'mongoose';
import { IBulk } from './bulk.interface';

const bulkSchema = new mongoose.Schema<IBulk>(
  {
    fileName: String,
    size: Number,
  },
  {
    timestamps: true,
  },
);
export const Bulk = mongoose.model('Bulk', bulkSchema);
