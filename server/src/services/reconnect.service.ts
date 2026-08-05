import { gameManager } from '../managers/game.manager';

/**
 * Reconnect Service
 *
 * Coordinates server-startup recovery logic.
 * Called once by server.ts after the HTTP server begins listening.
 *
 * Responsibility:
 *   - Delegate to GameManager to restore all ACTIVE games from the database.
 *
 * Kept as a separate service so server.ts stays clean and the startup
 * sequence reads clearly:
 *   listen → restoreActiveGames → accept player reconnects
 */
export const reconnectService = {
  async restoreActiveGames(): Promise<void> {
    await gameManager.restoreActiveGames();
  },
};
