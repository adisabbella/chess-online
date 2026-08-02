import { prisma } from '../config/prisma';
import { Prisma, GameStatus, GameResult } from '@prisma/client';

// ─── Input Interfaces ─────────────────────────────────────────────────────────

interface CreateGameData {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentFen: string;
}

interface FinishGameData {
  result: GameResult;
  winnerId: string | null;
  finalFen: string;
  finishedAt: Date;
}

// ─── Game Repository ──────────────────────────────────────────────────────────

export const gameRepository = {
  /**
   * Creates a new Game record with ACTIVE status.
   */
  async createGame(data: CreateGameData): Promise<void> {
    await prisma.game.create({
      data: {
        id: data.id,
        whitePlayerId: data.whitePlayerId,
        blackPlayerId: data.blackPlayerId,
        currentFen: data.currentFen,
        status: GameStatus.ACTIVE,
      },
    });
  },

  /**
   * Updates currentFen and updatedAt for an active game.
   * Accepts an optional transaction client.
   */
  async updateGameState(
    gameId: string,
    currentFen: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.game.update({
      where: { id: gameId },
      data: { currentFen },
    });
  },

  /**
   * Transitions the game to FINISHED.
   * Returns true if the update was applied, false if the game was already finished
   * (idempotency guard — prevents double-counting stats).
   */
  async finishGame(
    gameId: string,
    data: FinishGameData,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? prisma;
    const result = await client.game.updateMany({
      where: {
        id: gameId,
        status: GameStatus.ACTIVE, // only update if still active
      },
      data: {
        status: GameStatus.FINISHED,
        result: data.result,
        winnerId: data.winnerId,
        currentFen: data.finalFen,
        finishedAt: data.finishedAt,
      },
    });
    return result.count > 0;
  },

  async findById(gameId: string) {
    return prisma.game.findUnique({ where: { id: gameId } });
  },

  async findActiveGames() {
    return prisma.game.findMany({ where: { status: GameStatus.ACTIVE } });
  },
};
