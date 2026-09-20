import { Router } from 'express';
import { UsersController } from './users.controller';
import { validateCreateUser, validateUpdateUser } from './users.validator';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware';

const router = Router();
const controller = new UsersController();

// All user management routes require login
router.use(authenticateJWT as any);

// Viewing user directory / staff list
router.get('/', controller.getAll as any);
router.get('/:id', controller.getById as any);

// Mutating users requires Administrator, IT Administrator, Management, or HR Manager role
router.post('/', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, validateCreateUser, controller.create as any);
router.patch('/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, validateUpdateUser, controller.update as any);
router.delete('/:id', authorizeRoles(['Administrator', 'IT Administrator', 'Management', 'HR Manager']) as any, controller.delete as any);

export default router;
