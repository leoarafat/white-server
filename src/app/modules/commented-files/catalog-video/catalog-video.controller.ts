// import { Request, Response } from 'express';
// import catchAsync from '../../../shared/catchasync';
// import sendResponse from '../../../shared/sendResponse';
// import { catalogVideoService } from './catalog-video.service';

// const releaseSongs = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.releaseSongs(req.query);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const pendingSongs = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.pendingSongs(req.query);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const correctionSongs = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.correctionSongs(req.query);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const takeDownSongs = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.takeDownSongs(req.query);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const songInspection = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.songInspection(req.params.id);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const distributeMusic = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.distributeMusic(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// // const editMusic = catchAsync(async (req: Request, res: Response) => {
// //   const result = await catalogVideoService.editMusic(req);
// //   sendResponse(res, {
// //     statusCode: 200,
// //     success: true,
// //     message: 'Edit Successful',
// //     data: result,
// //   });
// // });
// const editMusic = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.editMusic(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Edit Successful',
//     data: result,
//   });
// });
// const manualApprove = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.manualApprove(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Edit Successful',
//     data: result,
//   });
// });
// const editVideo = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.editVideo(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Edit Successful',
//     data: result,
//   });
// });

// const transferToVevo = catchAsync(async (req: Request, res: Response) => {
//   await catalogVideoService.transferToVevo(req, res);
// });
// const transferFile = catchAsync(async (req: Request, res: Response) => {
//   await catalogVideoService.transferFile(req, res);
// });

// const makeTakeDown = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.makeTakeDown(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Take Successful',
//     data: result,
//   });
// });
// const removeTakeDown = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.removeTakeDown(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Take Successful',
//     data: result,
//   });
// });
// const correctionContent = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.correctionContent(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });
// const correctionData = catchAsync(async (req: Request, res: Response) => {
//   const result = await catalogVideoService.correctionData(req);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Successful',
//     data: result,
//   });
// });

// export const catalogVideoController = {
//   releaseSongs,
//   pendingSongs,
//   correctionSongs,
//   takeDownSongs,
//   songInspection,
//   distributeMusic,
//   editMusic,
//   makeTakeDown,
//   removeTakeDown,
//   correctionContent,
//   correctionData,
//   editVideo,
//   transferToVevo,
//   transferFile,
//   manualApprove,
// };
