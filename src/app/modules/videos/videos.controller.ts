import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { VideoService } from './videos.service';

const uploadVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.uploadVideo(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Uploaded Successful',
    data: result,
  });
});

// Immediate/background asset upload — the client sends a single `video` or
// `image` file the moment it's selected and gets back the S3 URL to keep in
// form state. The final `/video/upload` submit then just sends these URLs.
const uploadVideoAsset = catchAsync(async (req: Request, res: Response) => {
  const files = (req as any).files || {};
  const uploaded = files?.video?.[0] || files?.image?.[0];

  if (!uploaded) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'No file uploaded',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Asset Uploaded Successful',
    data: uploaded.location,
  });
});
const myAllVideo = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await VideoService.myAllVideo(id, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Retrieved Successful',
    data: result.data,
    meta: result.meta,
  });
});
const singleVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.singleVideo(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Retrieved Successful',
    data: result,
  });
});
const updateSingleVideo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await VideoService.updateSingleVideo(id, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Update Successful',
    data: result,
  });
});
const deleteSingleVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.deleteSingleVideo(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Delete Successful',
    data: result,
  });
});
const downloadImage = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.downloadImage(req, res);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Download Successful',
    data: result,
  });
});
const updateVideo = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.updateVideo(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Update Successful',
    data: result,
  });
});
const topUploaders = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.topUploaders(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Top Video Uploaders Retrieved Successful',
    data: result,
  });
});
const uploadVideoDraft = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.uploadVideoDraft(req as any);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Draft Saved Successful',
    data: result,
  });
});
const myVideoDrafts = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.myVideoDrafts(
    req.user as any,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Drafts Retrieved Successful',
    data: result,
  });
});
const singleVideoDraft = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.singleVideoDraft(
    req.params.id,
    req.user as any,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Draft Retrieved Successful',
    data: result,
  });
});
const deleteVideoDraft = catchAsync(async (req: Request, res: Response) => {
  const result = await VideoService.deleteVideoDraft(
    req.params.id,
    req.user as any,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Video Draft Deleted Successful',
    data: result,
  });
});
export const VideoController = {
  uploadVideo,
  uploadVideoAsset,
  myAllVideo,
  singleVideo,
  updateSingleVideo,
  deleteSingleVideo,
  downloadImage,
  updateVideo,
  topUploaders,
  uploadVideoDraft,
  myVideoDrafts,
  singleVideoDraft,
  deleteVideoDraft,
};
