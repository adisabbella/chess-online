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
   * Important: We use `terminate()` instead of `close()` to evict the old
   * socket. `close()` fires the WebSocket 'close' event, which would call
   * `removeConnection(userId, oldSocket)`. Since by the time that event fires
   * the new socket is already stored, a naive `removeConnection` would delete
   * the NEW socket and start a spurious disconnect timer — making the staying
   * player appear to have abandoned. `terminate()` destroys the socket without
   * triggering the 'close' event handler.
   */
  addConnection(userId: string, socket: WebSocket): void {
    const existing = this.connections.get(userId);
    if (existing && existing !== socket) {
      // Terminate rather than close — avoids the stale-close race condition
      // where the old socket's 'close' event fires after the new socket is
      // already stored and evicts it.
      existing.terminate();
    }
    this.connections.set(userId, socket);
    console.log(`[ws] user ${userId} connected (active: ${this.connections.size})`);

    // Check if this user has an active game — if so, reconnect them to it.
    // Always safe to call: if no active game exists, handleReconnect is a no-op.
    gameManager.handleReconnect(userId, socket);
  }

  /**
   * Removes the socket registration for the given user.
   *
   * `socket` is required to guard against the stale-close race condition:
   * when a player reconnects, the new socket is stored before the old socket
   * fires its 'close' event. Without this check, the old socket's close would
   * delete the NEW socket and start a spurious disconnect timer.
   *
   * Only acts if `socket` is still the currently registered socket for `userId`.
   */
  removeConnection(userId: string, socket: WebSocket): void {
    const current = this.connections.get(userId);
    if (current !== socket) {
      // This close event came from a stale (already replaced) socket — ignore it.
      console.log(`[ws] ignored stale close event for user ${userId}`);
      return;
    }

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
