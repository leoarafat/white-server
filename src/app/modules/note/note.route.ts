import express from 'express';
import { noteController } from './note.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';
import { validateRequest } from '../../middlewares/validateRequest';
import { NoteZodSchema } from './note.validations';

const router = express.Router();

router.post(
  '/add-note',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.SUB_USER,
  ),
  validateRequest(NoteZodSchema.addNoteSchema),
  noteController.insertIntoDB,
);
router.get(
  '/notes',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
  ),
  noteController.notes,
);
router.get(
  '/single-note/:id',
  auth(
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.SUB_USER,
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.USER,
  ),
  noteController.singleNote,
);
router.delete(
  '/delete-note/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  noteController.deleteNote,
);
router.patch(
  '/update-note/:id',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(NoteZodSchema.updateNoteSchema),
  noteController.updateNote,
);

export const NoteRoutes = router;
