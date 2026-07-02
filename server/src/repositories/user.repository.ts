import { prisma } from '../config/prisma';

interface CreateUserData {
  username: string;
  passwordHash: string;
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
};
