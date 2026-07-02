import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

interface JwtPayload {
  userId: string;
}

export const authService = {
  async signup(username: string, password: string) {
    const existing = await userRepository.findByUsername(username);
    if (existing) {
      throw new Error('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.createUser({ username, passwordHash });

    return { id: user.id, username: user.username };
  },

  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = authService.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed,
      },
    };
  },

  generateToken(userId: string): string {
    return jwt.sign({ userId } as JwtPayload, env.JWT_SECRET, { expiresIn: '7d' });
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  },
};
