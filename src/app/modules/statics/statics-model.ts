import { Schema, model } from 'mongoose';
import { IStatic, IStaticsData } from './static.interface';
//!
const singleMusicSchema = new Schema(
  {
    filename: { type: String, required: true },
    fieldname: { type: String, required: true },
    data: { type: Array, required: true },
    isProcessed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
const staticsDataSchema = new Schema<IStaticsData>({
  dateRange: { type: String },
  totalStreams: { type: Number },
  labelName: { type: String },
  streams: { type: Number },
});
const staticsSchema = new Schema<IStatic>(
  {
    filename: { type: String },
    fieldname: { type: String },
    data: [staticsDataSchema],
  },
  {
    timestamps: true,
  },
);

//!
export const Statics = model('Static', singleMusicSchema);
export const StreamStatics = model('StreamStatic', staticsSchema);
