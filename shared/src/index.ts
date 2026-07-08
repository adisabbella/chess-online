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
} as const;

export type WsEventTypeName = (typeof WsEventType)[keyof typeof WsEventType];

// ─── WebSocket Message Contract ───────────────────────────────────────────────

export interface WsMessage<T = Record<string, unknown>> {
  type: string;
  payload: T;
}

// ─── Matchmaking Payload Types ────────────────────────────────────────────────

export type PlayerColor = 'white' | 'black';

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

