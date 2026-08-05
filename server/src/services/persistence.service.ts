import { GameResult } from '@prisma/client';
import { MoveRecord } from '@chess-online/shared';
import { gameRepository } from '../repositories/game.repository';
import { moveRepository } from '../repositories/move.repository';
import { statisticsService } from './statistics.service';
import { GameSession } from '../sessions/game.session';

// ─── Persistence Service ──────────────────────────────────────────────────────

/**
 * Coordinates all persistence operations for the game lifecycle.
 *
 * Architecture:
 *   GameSession (in-memory source of truth)
 *       ↓
 *   PersistenceService (coordinates DB operations)
 *       ↓
 *   GameRepository / MoveRepository / UserRepository (Prisma access)
 *       ↓
 *   PostgreSQL
 *
 * GameSession never calls Prisma directly.
 * WebSocket handlers never call repositories directly.
 */
export const persistenceService = {
  /**
   * Creates a persistent Game record when a GameSession is created.
   * The game ID matches the in-memory session ID.
   */
  async createGame(session: GameSession): Promise<void> {
    await gameRepository.createGame({
      id: session.gameId,
      whitePlayerId: session.whitePlayerId,
      blackPlayerId: session.blackPlayerId,
      currentFen: session.getInitialFen(),
    });

    console.log(`[persistence] created game record: ${session.gameId}`);
  },

  /**
   * Persists an accepted move:
   *   1. Creates the Move record
   *   2. Updates Game.currentFen and Game.updatedAt
   *
   * NOTE: These run as two sequential queries rather than a Prisma interactive
   * transaction. Neon's pgBouncer pooler runs in transaction mode and rejects
   * interactive transactions (Prisma error P2028). Sequential writes are safe
   * here because chess turns are strictly alternating — there is no concurrent
   * write contention on the same game row.
   *
   * Throws on failure — callers handle the error via .catch() logging.
   */
  async persistMove(gameId: string, moveRecord: MoveRecord): Promise<void> {
    await moveRepository.createMove({
      gameId,
      moveNumber: moveRecord.moveNumber,
      from: moveRecord.from,
      to: moveRecord.to,
      san: moveRecord.san,
      fenAfterMove: moveRecord.fen,
    });

    await gameRepository.updateGameState(gameId, moveRecord.fen);
  },

  /**
   * Finalises a completed game:
   *   1. Transitions Game to FINISHED (idempotent — skipped if already finished)
   *   2. Updates player statistics (only if the transition was actually applied)
   *
   * Statistics are NOT updated for ABORTED games.
   * Throws on persistence failure — callers should log and handle accordingly.
   */
  async finishGame(
    gameId: string,
    whitePlayerId: string,
    blackPlayerId: string,
    result: GameResult,
    winnerId: string | null,
    finalFen: string,
  ): Promise<void> {
    const finishedAt = new Date();

    const wasApplied = await gameRepository.finishGame(gameId, {
      result,
      winnerId,
      finalFen,
      finishedAt,
    });

    if (!wasApplied) {
      console.warn(`[persistence] finishGame: game ${gameId} was already finished — skipping stats`);
      return;
    }

    console.log(`[persistence] finished game ${gameId}: ${result}`);

    // Update statistics for decisive results (not ABORTED)
    if (result === 'WHITE_WIN' || result === 'BLACK_WIN' || result === 'DRAW') {
      await statisticsService.updateStats(whitePlayerId, blackPlayerId, result);
    }
  },
};
