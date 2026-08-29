import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { ReportConverterService } from './report-converter.service';

const uploadAndAnalyze = catchAsync(async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please choose a .csv or .xlsx file.');
  }

  const result = ReportConverterService.analyzeUpload(file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File analyzed successfully',
    data: result,
  });
});

const convert = catchAsync(async (req: Request, res: Response) => {
  const { jobId, mapping } = req.body as { jobId: string; mapping: any };
  if (!jobId || !mapping) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'jobId and mapping are required.');
  }

  const result = ReportConverterService.startConversion(jobId, mapping);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Conversion started',
    data: result,
  });
});

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const result = ReportConverterService.getStatus(req.params.jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Status retrieved',
    data: result,
  });
});

const download = catchAsync(async (req: Request, res: Response) => {
  const { csv, fileName } = ReportConverterService.getDownload(req.params.jobId);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.status(200).send(csv);
});

const getTemplates = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportConverterService.listTemplates();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Templates retrieved',
    data: result,
  });
});

const saveTemplate = catchAsync(async (req: Request, res: Response) => {
  const { name, mapping } = req.body as { name: string; mapping: any };
  const adminId = (req as any).user?.userId;

  const result = await ReportConverterService.saveTemplate(name, mapping, adminId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Template saved',
    data: result,
  });
});

const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportConverterService.deleteTemplate(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Template deleted',
    data: result,
  });
});

export const ReportConverterController = {
  uploadAndAnalyze,
  convert,
  getStatus,
  download,
  getTemplates,
  saveTemplate,
  deleteTemplate,
};
