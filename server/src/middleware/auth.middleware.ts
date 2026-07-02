import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AUTH_COOKIE_NAME } from '../config/cookie';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};
