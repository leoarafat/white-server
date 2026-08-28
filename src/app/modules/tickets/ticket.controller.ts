import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchasync';
import sendResponse from '../../../shared/sendResponse';
import { ticketService } from './ticket.service';

const ok = (res: Response, data: any, message = 'Success') =>
  sendResponse(res, { statusCode: 200, success: true, message, data });

const createTicket = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.createTicket(req), 'Ticket created');
});

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.getMyTickets(req));
});

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.getAllTickets(req));
});

const getTicketById = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.getTicketById(req, req.params.id));
});

const replyToTicket = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.replyToTicket(req, req.params.id), 'Reply sent');
});

const updateTicketStatus = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.updateTicketStatus(req, req.params.id));
});

const updateTicketMeta = catchAsync(async (req: Request, res: Response) => {
  ok(res, await ticketService.updateTicketMeta(req, req.params.id));
});

export const ticketController = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
  updateTicketMeta,
};
