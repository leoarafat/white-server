import express from 'express';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { uploadFile } from '../../middlewares/fileUpload';
import { ticketController } from './ticket.controller';
import { requirePermission } from '../../../shared/subUserAccess';
import { validateRequest } from '../../middlewares/validateRequest';
import { TicketZodSchema } from './ticket.validations';

const router = express.Router();

const USER_ROLES = [ENUM_USER_ROLE.USER, ENUM_USER_ROLE.SUB_USER];
const ADMIN_ROLES = [ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN];
const ALL_ROLES = [...USER_ROLES, ...ADMIN_ROLES];

// ---- User side ----
router.post(
  '/',
  auth(...USER_ROLES),
  requirePermission('/support'),
  uploadFile,
  validateRequest(TicketZodSchema.createTicketSchema),
  ticketController.createTicket,
);
router.get(
  '/my',
  auth(...USER_ROLES),
  requirePermission('/support'),
  ticketController.getMyTickets,
);

// ---- Admin side ----
router.get('/', auth(...ADMIN_ROLES), ticketController.getAllTickets);
router.patch(
  '/:id/meta',
  auth(...ADMIN_ROLES),
  validateRequest(TicketZodSchema.updateTicketMetaSchema),
  ticketController.updateTicketMeta,
);

// ---- Shared (ownership enforced in service) ----
router.get(
  '/:id',
  auth(...ALL_ROLES),
  requirePermission('/support'),
  ticketController.getTicketById,
);
router.post(
  '/:id/reply',
  auth(...ALL_ROLES),
  requirePermission('/support'),
  uploadFile,
  validateRequest(TicketZodSchema.replyToTicketSchema),
  ticketController.replyToTicket,
);
router.patch(
  '/:id/status',
  auth(...ALL_ROLES),
  requirePermission('/support'),
  validateRequest(TicketZodSchema.updateTicketStatusSchema),
  ticketController.updateTicketStatus,
);

export const TicketRoutes = router;
