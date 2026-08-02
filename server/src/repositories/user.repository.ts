import { prisma } from '../config/prisma';

interface CreateUserData {
  username: string;
  passwordHash: string;
}

interface StatsDelta {
  wins?: number;
  losses?: number;
  draws?: number;
  gamesPlayed?: number;
}

export const userRepository = {
  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async createUser(data: CreateUserData) {
    return prisma.user.create({ data });
  },

  async incrementStats(userId: string, delta: StatsDelta): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        wins: delta.wins !== undefined ? { increment: delta.wins } : undefined,
        losses: delta.losses !== undefined ? { increment: delta.losses } : undefined,
        draws: delta.draws !== undefined ? { increment: delta.draws } : undefined,
        gamesPlayed: delta.gamesPlayed !== undefined ? { increment: delta.gamesPlayed } : undefined,
      },
    });
  },
};
