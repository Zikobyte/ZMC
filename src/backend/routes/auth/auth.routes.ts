import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateLogin } from './auth.validator';

const router = Router();
const controller = new AuthController();

router.post('/login', validateLogin, controller.login);

export default router;
