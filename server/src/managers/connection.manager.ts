import WebSocket from 'ws';

class ConnectionManager {
  private connections: Map<string, WebSocket> = new Map();

  addConnection(userId: string, socket: WebSocket): void {
    const existing = this.connections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    this.connections.set(userId, socket);
    console.log(`[ws] user ${userId} connected (active: ${this.connections.size})`);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
    console.log(`[ws] user ${userId} disconnected (active: ${this.connections.size})`);
  }

  getConnection(userId: string): WebSocket | undefined {
    return this.connections.get(userId);
  }

  hasConnection(userId: string): boolean {
    return this.connections.has(userId);
  }
}

export const connectionManager = new ConnectionManager();
