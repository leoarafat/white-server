import { Schema, model } from 'mongoose';
import { IFaq } from './faq.interface';

const FaqSchema = new Schema<IFaq>({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

export const Faq = model<IFaq>('Faq', FaqSchema);
