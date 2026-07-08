import crypto from 'crypto';
import { GameSession } from '../sessions/game.session';
import { gameSessionManager } from './gameSession.manager';

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

class GameManager {
  createGame(playerAId: string, playerBId: string): GameSession {
    const gameId = crypto.randomUUID();

    // Randomly assign colors
    const [whitePlayerId, blackPlayerId] =
      Math.random() < 0.5 ? [playerAId, playerBId] : [playerBId, playerAId];

    const session: GameSession = {
      gameId,
      whitePlayerId,
      blackPlayerId,
      status: 'active',
      createdAt: new Date(),
    };

    gameSessionManager.registerSession(session);

    console.log(
      `[game] created game ${gameId} — white: ${whitePlayerId}, black: ${blackPlayerId}`,
    );

    return session;
  }
}

export const gameManager = new GameManager();
