import WebSocket from 'ws';
import { gameManager } from './game.manager';

class ConnectionManager {
  private connections: Map<string, WebSocket> = new Map();

  /**
   * Registers a new socket for the given user.
   *
   * If an existing open socket is found for this user, it is closed (duplicate
   * connection guard — only one active connection per user is allowed).
   *
   * After registering, attempts to reconnect the user to any active GameSession.
   * This handles both browser-refresh reconnects and post-server-restart reconnects.
   */
  addConnection(userId: string, socket: WebSocket): void {
    const existing = this.connections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    this.connections.set(userId, socket);
    console.log(`[ws] user ${userId} connected (active: ${this.connections.size})`);

    // Check if this user has an active game — if so, reconnect them to it.
    // This is always safe to call: if no active game exists, handleReconnect is a no-op.
    gameManager.handleReconnect(userId, socket);
  }

  /**
   * Removes the socket registration for the given user.
   * Notifies GameManager so it can start the disconnect timer if the user
   * is mid-game.
   */
  removeConnection(userId: string): void {
    this.connections.delete(userId);
    console.log(`[ws] user ${userId} disconnected (active: ${this.connections.size})`);

    // Notify GameManager — starts the 60-second reconnect timer if in a game.
    gameManager.handleDisconnect(userId);
  }

  getConnection(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }

  hasConnection(userId: string): boolean {
    return this.connections.has(userId);
  }
}

export const connectionManager = new ConnectionManager();
