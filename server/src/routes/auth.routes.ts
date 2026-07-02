import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/signup', authController.signup);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
