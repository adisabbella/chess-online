import { IncomingMessage } from 'http';
import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse as parseCookies } from 'cookie';
import { authService } from '../services/auth.service';
import { AUTH_COOKIE_NAME } from '../config/cookie';
import { connectionManager } from '../managers/connection.manager';
import { eventDispatcher } from './eventDispatcher';
import { AuthenticatedSocket } from './websocket.types';
import { registerMatchmakingHandlers } from './handlers/matchmaking.handlers';

function getUserIdFromRequest(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie ?? '';
  const cookies = parseCookies(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) return null;

  try {
    const payload = authService.verifyToken(token);
    return payload.userId;
  } catch {
    return null;
  }
}

export function initWebSocketServer(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ server: httpServer });

  registerMatchmakingHandlers();

  wss.on('connection', (socket: AuthenticatedSocket, req: IncomingMessage) => {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      console.log('[ws] rejected connection — no valid cookie');
      socket.close(1008, 'Unauthorized');
      return;
    }

    socket.userId = userId;

    connectionManager.addConnection(userId, socket);

    socket.on('message', (data) => {
      console.log(`[ws] message from ${userId}: ${data.toString()}`);
      eventDispatcher.dispatch(socket, userId, data.toString());
    });

    socket.on('close', () => {
      connectionManager.removeConnection(userId);
    });

    socket.on('error', (err) => {
      console.error(`[ws] socket error for user ${userId}:`, err.message);
    });
  });

  console.log('[ws] WebSocket server initialized');
}
