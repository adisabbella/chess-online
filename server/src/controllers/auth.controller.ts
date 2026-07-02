import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { AUTH_COOKIE_NAME, cookieOptions } from '../config/cookie';

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' });
      return;
    }

    try {
      const user = await authService.signup(username, password);
      console.log(`[auth] signup: ${user.username}`);
      res.status(201).json({ user });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      res.status(409).json({ error: message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' });
      return;
    }

    try {
      const { token, user } = await authService.login(username, password);
      res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
      console.log(`[auth] login: ${user.username}`);
      res.status(200).json({ user });
    } catch {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  },

  logout(req: Request, res: Response): void {
    const username = req.userId ?? 'unknown';
    res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
    console.log(`[auth] logout: userId=${username}`);
    res.status(200).json({ message: 'Logged out' });
  },

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.userId as string;

    const user = await userRepository.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed,
      },
    });
  },
};
