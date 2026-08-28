import mongoose from 'mongoose';

const songRecognitionSchema = new mongoose.Schema({
  songId: {
    type: String,
    required: true,
    unique: true,
  },
  recognitionData: {
    type: Object,
    required: true,
  },
});

export const SongRecognition = mongoose.model(
  'SongRecognition',
  songRecognitionSchema,
);
