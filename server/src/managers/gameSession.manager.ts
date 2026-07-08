import { GameSession } from '../sessions/game.session';

class GameSessionManager {
  private activeGames: Map<string, GameSession> = new Map();
  private userToGame: Map<string, string> = new Map();

  registerSession(session: GameSession): void {
    this.activeGames.set(session.gameId, session);
    this.userToGame.set(session.whitePlayerId, session.gameId);
    this.userToGame.set(session.blackPlayerId, session.gameId);
    console.log(`[game] session registered: ${session.gameId}`);
  }

  removeSession(gameId: string): void {
    const session = this.activeGames.get(gameId);
    if (!session) return;

    this.userToGame.delete(session.whitePlayerId);
    this.userToGame.delete(session.blackPlayerId);
    this.activeGames.delete(gameId);
    console.log(`[game] session removed: ${gameId}`);
  }

  getSession(gameId: string): GameSession | undefined {
    return this.activeGames.get(gameId);
  }

  getSessionByUser(userId: string): GameSession | undefined {
    const gameId = this.userToGame.get(userId);
    if (!gameId) return undefined;
    return this.activeGames.get(gameId);
  }

  hasActiveGame(userId: string): boolean {
    return this.userToGame.has(userId);
  }
}

export const gameSessionManager = new GameSessionManager();
