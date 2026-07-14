import WebSocket from 'ws';
import { WsEventType, GameFoundPayload, QueueStatusPayload } from '@chess-online/shared';
import { eventDispatcher } from '../eventDispatcher';
import { matchmakingManager } from '../../managers/matchmaking.manager';
import { connectionManager } from '../../managers/connection.manager';
import { GameSession } from '../../sessions/game.session';

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

export function registerMatchmakingHandlers(): void {
  eventDispatcher.registerHandler(WsEventType.JOIN_QUEUE, (socket, userId) => {
    let result;

    try {
      result = matchmakingManager.joinQueue(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not join queue';
      sendMessage(socket, WsEventType.ERROR, { message });
      return;
    }

    if (result.matched) {
      const { session } = result;
      sendGameFound(session.whitePlayerId, session);
      sendGameFound(session.blackPlayerId, session);
      return;
    }

    const queuePayload: QueueStatusPayload = { position: result.position };
    sendMessage(socket, WsEventType.QUEUE_STATUS, queuePayload);
  });

  eventDispatcher.registerHandler(WsEventType.LEAVE_QUEUE, (socket, userId) => {
    matchmakingManager.leaveQueue(userId);
    sendMessage(socket, WsEventType.QUEUE_LEFT, {});
  });
}
