import crypto from 'crypto';
import { GameResult as PrismaGameResult } from '@prisma/client';
import { GameOverPayload } from '@chess-online/shared';
import { GameSession, MoveResult, DrawOfferResult, DrawRespondResult } from '../sessions/game.session';
import { gameSessionManager } from './gameSession.manager';
import { persistenceService } from '../services/persistence.service';

// ─── Local Types ──────────────────────────────────────────────────────────────

interface ResignSuccess {
  type: 'game_over';
  gameOver: GameOverPayload;
}

interface ActionRejection {
  type: 'rejected';
  reason: string;
}

type ResignResult = ResignSuccess | ActionRejection;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps the shared GameResult string to the Prisma GameResult enum value.
 * The shared type uses the same string values, so this is a safe cast validated at compile time.
 */
function toPrismaResult(result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW'): PrismaGameResult {
  return result as PrismaGameResult;
}

// ─── Game Manager ─────────────────────────────────────────────────────────────

class GameManager {
  /**
   * Creates a new in-memory GameSession and persists the corresponding Game record.
   * Throws if persistence fails — callers must handle the error.
   */
  async createGame(playerAId: string, playerBId: string): Promise<GameSession> {
    const gameId = crypto.randomUUID();

    // Randomly assign colors
    const [whitePlayerId, blackPlayerId] =
      Math.random() < 0.5 ? [playerAId, playerBId] : [playerBId, playerAId];

    const session = new GameSession(gameId, whitePlayerId, blackPlayerId);

    gameSessionManager.registerSession(session);

    // Persist before returning — throw on failure so matchmaking handler knows
    await persistenceService.createGame(session);

    console.log(
      `[game] created game ${gameId} — white: ${whitePlayerId}, black: ${blackPlayerId}`,
    );

    return session;
  }

  /**
   * Applies a move in-memory and persists it atomically.
   * Returns the MoveResult; throws if an accepted move fails to persist.
   */
  async handleMove(
    userId: string,
    gameId: string,
    from: string,
    to: string,
    promotion?: string,
  ): Promise<MoveResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.makeMove(userId, from, to, promotion);

    if (result.type === 'rejected') {
      return result;
    }

    // Move was accepted — the last entry in moveHistory is the new move
    const lastMove = session.moveHistory[session.moveHistory.length - 1];

    // Persist move + FEN atomically; throws on DB error
    await persistenceService.persistMove(gameId, lastMove);

    if (result.type === 'game_over') {
      const { winner, result: gameResult } = result.gameOver;
      await persistenceService.finishGame(
        gameId,
        session.whitePlayerId,
        session.blackPlayerId,
        toPrismaResult(gameResult),
        winner,
        result.gameOver.finalFen,
      );
    }

    return result;
  }

  /**
   * Processes a resignation and persists the game result.
   */
  async handleResign(userId: string, gameId: string): Promise<ResignResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.resign(userId);

    if (result.type === 'rejected') {
      return result;
    }

    const { winner, result: gameResult } = result.gameOver;
    await persistenceService.finishGame(
      gameId,
      session.whitePlayerId,
      session.blackPlayerId,
      toPrismaResult(gameResult),
      winner,
      result.gameOver.finalFen,
    );

    return result;
  }

  handleOfferDraw(userId: string, gameId: string): DrawOfferResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.offerDraw(userId);
  }

  /**
   * Processes a draw response and persists the game result if draw is accepted.
   */
  async handleRespondDraw(userId: string, gameId: string, accept: boolean): Promise<DrawRespondResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.respondDraw(userId, accept);

    if (result.type === 'game_over') {
      await persistenceService.finishGame(
        gameId,
        session.whitePlayerId,
        session.blackPlayerId,
        'DRAW',
        null,
        result.gameOver.finalFen,
      );
    }

    return result;
  }

  removeFinishedGame(gameId: string): void {
    gameSessionManager.removeSession(gameId);
  }
}

export const gameManager = new GameManager();
