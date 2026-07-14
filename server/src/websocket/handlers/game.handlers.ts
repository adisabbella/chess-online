import WebSocket from 'ws';
import {
  WsEventType,
  MakeMovePayload,
  ResignPayload,
  OfferDrawPayload,
  RespondDrawPayload,
  DrawOfferedPayload,
  DrawResponsePayload,
} from '@chess-online/shared';
import { eventDispatcher } from '../eventDispatcher';
import { gameManager } from '../../managers/game.manager';
import { connectionManager } from '../../managers/connection.manager';
import { gameSessionManager } from '../../managers/gameSession.manager';

function sendMessage(socket: WebSocket, type: string, payload: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

function broadcastToGame(gameId: string, type: string, payload: object): void {
  const session = gameSessionManager.getSession(gameId);
  if (!session) return;

  const whiteSocket = connectionManager.getConnection(session.whitePlayerId);
  const blackSocket = connectionManager.getConnection(session.blackPlayerId);

  if (whiteSocket) sendMessage(whiteSocket, type, payload);
  if (blackSocket) sendMessage(blackSocket, type, payload);
}

function sendToUser(userId: string, type: string, payload: object): void {
  const socket = connectionManager.getConnection(userId);
  if (socket) sendMessage(socket, type, payload);
}

export function registerGameHandlers(): void {
  // ─── MAKE_MOVE ──────────────────────────────────────────────────────────

  eventDispatcher.registerHandler(WsEventType.MAKE_MOVE, (socket, userId, payload) => {
    const { gameId, from, to, promotion } = payload as unknown as MakeMovePayload;

    if (!gameId || !from || !to) {
      sendMessage(socket, WsEventType.ERROR, { message: 'Invalid move payload' });
      return;
    }

    const result = gameManager.handleMove(userId, gameId, from, to, promotion);

    if (result.type === 'rejected') {
      sendMessage(socket, WsEventType.MOVE_REJECTED, { reason: result.reason });
      return;
    }

    // Broadcast state update to both players
    broadcastToGame(gameId, WsEventType.GAME_STATE_UPDATE, result.stateUpdate);

    if (result.type === 'game_over') {
      broadcastToGame(gameId, WsEventType.GAME_OVER, result.gameOver);
      gameManager.removeFinishedGame(gameId);
      console.log(`[game] game ${gameId} ended: ${result.gameOver.reason}`);
    }
  });

  // ─── RESIGN ─────────────────────────────────────────────────────────────

  eventDispatcher.registerHandler(WsEventType.RESIGN, (socket, userId, payload) => {
    const { gameId } = payload as unknown as ResignPayload;

    if (!gameId) {
      sendMessage(socket, WsEventType.ERROR, { message: 'Invalid resign payload' });
      return;
    }

    const result = gameManager.handleResign(userId, gameId);

    if (result.type === 'rejected') {
      sendMessage(socket, WsEventType.ERROR, { message: result.reason });
      return;
    }

    broadcastToGame(gameId, WsEventType.GAME_OVER, result.gameOver);
    gameManager.removeFinishedGame(gameId);
    console.log(`[game] game ${gameId} ended: RESIGN`);
  });

  // ─── OFFER_DRAW ─────────────────────────────────────────────────────────

  eventDispatcher.registerHandler(WsEventType.OFFER_DRAW, (socket, userId, payload) => {
    const { gameId } = payload as unknown as OfferDrawPayload;

    if (!gameId) {
      sendMessage(socket, WsEventType.ERROR, { message: 'Invalid draw offer payload' });
      return;
    }

    const result = gameManager.handleOfferDraw(userId, gameId);

    if (result.type === 'rejected') {
      sendMessage(socket, WsEventType.ERROR, { message: result.reason });
      return;
    }

    // Notify opponent about the draw offer
    const session = gameSessionManager.getSession(gameId);
    if (!session) return;

    const opponentId = userId === session.whitePlayerId
      ? session.blackPlayerId
      : session.whitePlayerId;

    const drawPayload: DrawOfferedPayload = {
      gameId,
      offeredBy: result.offeredByColor,
    };

    sendToUser(opponentId, WsEventType.DRAW_OFFERED, drawPayload);
    console.log(`[game] draw offered in game ${gameId} by ${result.offeredByColor}`);
  });

  // ─── RESPOND_DRAW ───────────────────────────────────────────────────────

  eventDispatcher.registerHandler(WsEventType.RESPOND_DRAW, (socket, userId, payload) => {
    const { gameId, accept } = payload as unknown as RespondDrawPayload;

    if (!gameId || typeof accept !== 'boolean') {
      sendMessage(socket, WsEventType.ERROR, { message: 'Invalid draw response payload' });
      return;
    }

    const result = gameManager.handleRespondDraw(userId, gameId, accept);

    if (result.type === 'rejected') {
      sendMessage(socket, WsEventType.ERROR, { message: result.reason });
      return;
    }

    if (result.type === 'game_over') {
      broadcastToGame(gameId, WsEventType.GAME_OVER, result.gameOver);
      gameManager.removeFinishedGame(gameId);
      console.log(`[game] game ${gameId} ended: DRAW_AGREEMENT`);
      return;
    }

    // Draw declined — notify both players
    const drawResponse: DrawResponsePayload = { gameId, accepted: false };
    broadcastToGame(gameId, WsEventType.DRAW_RESPONSE, drawResponse);
    console.log(`[game] draw declined in game ${gameId}`);
  });
}
