/**
 * Shared constants, types, and enums for chess-online.
 * Used by both the client and server packages.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const APP_NAME = 'chess-online' as const;

export const APP_VERSION = '1.0.0' as const;

// ─── WebSocket Event Types ────────────────────────────────────────────────────

export const WsEventType = {
  // Infrastructure
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',

  // Matchmaking — Client → Server
  JOIN_QUEUE: 'JOIN_QUEUE',
  LEAVE_QUEUE: 'LEAVE_QUEUE',

  // Matchmaking — Server → Client
  GAME_FOUND: 'GAME_FOUND',
  QUEUE_STATUS: 'QUEUE_STATUS',
  QUEUE_LEFT: 'QUEUE_LEFT',

  // Gameplay — Client → Server
  MAKE_MOVE: 'MAKE_MOVE',
  RESIGN: 'RESIGN',
  OFFER_DRAW: 'OFFER_DRAW',
  RESPOND_DRAW: 'RESPOND_DRAW',

  // Gameplay — Server → Client
  GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
  MOVE_REJECTED: 'MOVE_REJECTED',
  GAME_OVER: 'GAME_OVER',
  DRAW_OFFERED: 'DRAW_OFFERED',
  DRAW_RESPONSE: 'DRAW_RESPONSE',

  // Reconnection — Server → Client
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
} as const;

export type WsEventTypeName = (typeof WsEventType)[keyof typeof WsEventType];

// ─── WebSocket Message Contract ───────────────────────────────────────────────

export interface WsMessage<T = Record<string, unknown>> {
  type: string;
  payload: T;
}

// ─── Common Types ─────────────────────────────────────────────────────────────

export type PlayerColor = 'white' | 'black';

// ─── Game Status & Result ─────────────────────────────────────────────────────

export type GameStatus = 'active' | 'finished' | 'aborted';

export type GameResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';

export type GameEndReason =
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'RESIGN'
  | 'DRAW_AGREEMENT'
  | 'INSUFFICIENT_MATERIAL'
  | 'THREEFOLD_REPETITION'
  | 'FIFTY_MOVE_RULE'
  | 'ABANDONMENT';

// ─── Matchmaking Payload Types ────────────────────────────────────────────────

export interface GameFoundPayload {
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  color: PlayerColor;
  initialFen: string;
}

export interface QueueStatusPayload {
  position: number;
}

// ─── Move Record ──────────────────────────────────────────────────────────────

export interface MoveRecord {
  moveNumber: number;
  from: string;
  to: string;
  san: string;
  fen: string;
}

// ─── Gameplay — Client → Server Payloads ──────────────────────────────────────

export interface MakeMovePayload {
  gameId: string;
  from: string;
  to: string;
  promotion?: string;
}

export interface ResignPayload {
  gameId: string;
}

export interface OfferDrawPayload {
  gameId: string;
}

export interface RespondDrawPayload {
  gameId: string;
  accept: boolean;
}

// ─── Gameplay — Server → Client Payloads ──────────────────────────────────────

/**
 * Sent after every valid move and also immediately on player reconnect
 * to restore the full game state on the client.
 *
 * `color` is included so that a client reconnecting after a refresh or
 * server restart can determine which side they are playing without
 * needing a separate GAME_FOUND event.
 *
 * `lastMove` is null when no moves have been played yet (e.g. reconnect
 * to a freshly-started game).
 */
export interface GameStateUpdatePayload {
  gameId: string;
  fen: string;
  lastMove: {
    from: string;
    to: string;
    san: string;
  } | null;
  moveHistory: MoveRecord[];
  turn: PlayerColor;
  gameStatus: GameStatus;
  isCheck: boolean;
  /** The requesting player's own color. Always set on reconnect restore. */
  color: PlayerColor;
}

export interface MoveRejectedPayload {
  reason: string;
}

export interface GameOverPayload {
  gameId: string;
  result: GameResult;
  reason: GameEndReason;
  winner: string | null;
  finalFen: string;
}

export interface DrawOfferedPayload {
  gameId: string;
  offeredBy: PlayerColor;
}

export interface DrawResponsePayload {
  gameId: string;
  accepted: boolean;
}

// ─── Reconnection Payload Types ───────────────────────────────────────────────

/** Sent to the opponent when a player's WebSocket disconnects. */
export interface PlayerDisconnectedPayload {
  playerId: string;
  remainingSeconds: number;
}

/** Sent to the opponent when a disconnected player reconnects. */
export interface PlayerReconnectedPayload {
  playerId: string;
}
