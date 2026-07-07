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
} as const;

export type WsEventTypeName = (typeof WsEventType)[keyof typeof WsEventType];

// ─── WebSocket Message Contract ───────────────────────────────────────────────

export interface WsMessage<T = Record<string, unknown>> {
  type: string;
  payload: T;
}

