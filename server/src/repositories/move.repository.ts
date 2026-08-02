import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

// ─── Input Interface ──────────────────────────────────────────────────────────

interface CreateMoveData {
  gameId: string;
  moveNumber: number;
  from: string;
  to: string;
  san: string;
  fenAfterMove: string;
}

// ─── Move Repository ──────────────────────────────────────────────────────────

export const moveRepository = {
  /**
   * Persists a single move record.
   * Move records are immutable — never update after creation.
   * Accepts an optional transaction client.
   */
  async createMove(data: CreateMoveData, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.move.create({ data });
  },

  /**
   * Retrieves all moves for a game, ordered by creation time.
   */
  async findMovesByGameId(gameId: string) {
    return prisma.move.findMany({
      where: { gameId },
      orderBy: { createdAt: 'asc' },
    });
  },
};
