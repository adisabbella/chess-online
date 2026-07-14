import crypto from 'crypto';
import { GameSession, MoveResult, DrawOfferResult, DrawRespondResult } from '../sessions/game.session';
import { gameSessionManager } from './gameSession.manager';
import { GameOverPayload } from '@chess-online/shared';

interface ResignSuccess {
  type: 'game_over';
  gameOver: GameOverPayload;
}

interface ActionRejection {
  type: 'rejected';
  reason: string;
}

type ResignResult = ResignSuccess | ActionRejection;

class GameManager {
  createGame(playerAId: string, playerBId: string): GameSession {
    const gameId = crypto.randomUUID();

    // Randomly assign colors
    const [whitePlayerId, blackPlayerId] =
      Math.random() < 0.5 ? [playerAId, playerBId] : [playerBId, playerAId];

    const session = new GameSession(gameId, whitePlayerId, blackPlayerId);

    gameSessionManager.registerSession(session);

    console.log(
      `[game] created game ${gameId} — white: ${whitePlayerId}, black: ${blackPlayerId}`,
    );

    return session;
  }

  handleMove(userId: string, gameId: string, from: string, to: string, promotion?: string): MoveResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.makeMove(userId, from, to, promotion);
  }

  handleResign(userId: string, gameId: string): ResignResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.resign(userId);
  }

  handleOfferDraw(userId: string, gameId: string): DrawOfferResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.offerDraw(userId);
  }

  handleRespondDraw(userId: string, gameId: string, accept: boolean): DrawRespondResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.respondDraw(userId, accept);
  }

  removeFinishedGame(gameId: string): void {
    gameSessionManager.removeSession(gameId);
  }
}

export const gameManager = new GameManager();
