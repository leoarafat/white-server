import { Request, Response } from 'express';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { Faq } from './faq.model';

export const FaqController = {
  async addFaq(req: Request, res: Response): Promise<void> {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Question and Answer are required',
        );
      }
      const newFaq = await Faq.create({ question, answer });
      res.status(httpStatus.CREATED).json(newFaq);
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
      });
    }
  },

  async getFaq(req: Request, res: Response): Promise<void> {
    try {
      const faqs = await Faq.find();
      res.status(httpStatus.OK).json(faqs);
    } catch (error: any) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
      });
    }
  },

  async updateFaq(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { question, answer } = req.body;
      if (!question || !answer) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Question and Answer are required',
        );
      }
      const updatedFaq = await Faq.findByIdAndUpdate(
        id,
        { question, answer },
        { new: true, runValidators: true },
      );
      if (!updatedFaq) {
        throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found');
      }
      res.status(httpStatus.OK).json(updatedFaq);
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
      });
    }
  },

  async deleteFaq(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedFaq = await Faq.findByIdAndDelete(id);
      if (!deletedFaq) {
        throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found');
      }
      res.status(httpStatus.NO_CONTENT).send();
    } catch (error: any) {
      res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
        message: error.message,
      });
    }
  },
};
