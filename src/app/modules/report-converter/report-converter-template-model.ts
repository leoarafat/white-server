import { Schema, model } from 'mongoose';

const fieldMappingSchema = new Schema(
  {
    type: { type: String, enum: ['column', 'constant', 'none'], required: true },
    header: { type: String },
    value: { type: String },
  },
  { _id: false },
);

const reportConverterTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    mapping: {
      source: { type: fieldMappingSchema, required: true },
      isrc: { type: fieldMappingSchema, required: true },
      title: { type: fieldMappingSchema, required: true },
      artist: { type: fieldMappingSchema, required: true },
      countryCode: { type: fieldMappingSchema, required: true },
      allStreams: { type: fieldMappingSchema, required: true },
      perStreamRate: { type: fieldMappingSchema, required: true },
      gross: { type: fieldMappingSchema, required: true },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export const ReportConverterTemplate = model(
  'ReportConverterTemplate',
  reportConverterTemplateSchema,
);
