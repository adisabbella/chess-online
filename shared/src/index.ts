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
  | 'FIFTY_MOVE_RULE';

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

export interface GameStateUpdatePayload {
  gameId: string;
  fen: string;
  lastMove: {
    from: string;
    to: string;
    san: string;
  };
  moveHistory: MoveRecord[];
  turn: PlayerColor;
  gameStatus: GameStatus;
  isCheck: boolean;
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
