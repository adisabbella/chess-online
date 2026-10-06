import WebSocket from 'ws';
import { WsEventType, GameFoundPayload, QueueStatusPayload } from '@chess-online/shared';
import { eventDispatcher } from '../eventDispatcher';
import { matchmakingManager } from '../../managers/matchmaking.manager';
import { connectionManager } from '../../managers/connection.manager';
import { gameSessionManager } from '../../managers/gameSession.manager';
import { GameSession } from '../../sessions/game.session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sendMessage(socket: WebSocket, type: string, payload: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

function sendGameFound(userId: string, session: GameSession): void {
  const socket = connectionManager.getConnection(userId);
  if (!socket) return;

  const color = session.getPlayerColor(userId);
  if (!color) return;

  const payload: GameFoundPayload = {
    gameId: session.gameId,
    whitePlayerId: session.whitePlayerId,
    blackPlayerId: session.blackPlayerId,
    color,
    initialFen: session.getInitialFen(),
  };

  sendMessage(socket, WsEventType.GAME_FOUND, payload);
}

// ─── Handler Registration ─────────────────────────────────────────────────────

export function registerMatchmakingHandlers(): void {
  eventDispatcher.registerHandler(WsEventType.JOIN_QUEUE, (socket, userId) => {
    void (async () => {
      try {
        const result = await matchmakingManager.joinQueue(userId);

        if (result.matched) {
          const { session } = result;
          sendGameFound(session.whitePlayerId, session);
          sendGameFound(session.blackPlayerId, session);
          return;
        }

        const queuePayload: QueueStatusPayload = { position: result.position };
        sendMessage(socket, WsEventType.QUEUE_STATUS, queuePayload);
      } catch (err) {
        // Check if this is the "user already has an active game" case.
        // If so, send the current game state instead of an error — the client
        // will navigate to the existing game (reconnect path).
        const session = gameSessionManager.getSessionByUser(userId);
        if (session && session.status === 'active') {
          const fullState = session.getFullState(userId);
          if (fullState) {
            console.log(
              `[matchmaking] user ${userId} tried to join queue but has active game ${session.gameId} — sending game state`,
            );
            sendMessage(socket, WsEventType.GAME_STATE_UPDATE, fullState);
            return;
          }
        }

        // Genuine error — send ERROR to client
        const message = err instanceof Error ? err.message : 'Could not join queue';
        console.error(`[matchmaking] join queue error for user ${userId}:`, err);
        sendMessage(socket, WsEventType.ERROR, { message });
      }
    })();
  });

  eventDispatcher.registerHandler(WsEventType.LEAVE_QUEUE, (socket, userId) => {
    matchmakingManager.leaveQueue(userId);
    sendMessage(socket, WsEventType.QUEUE_LEFT, {});
  });
}
