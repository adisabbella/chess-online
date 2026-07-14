import { useEffect, useCallback, useRef } from 'react';
import {
  WsEventType,
  GameStateUpdatePayload,
  GameOverPayload,
  MoveRejectedPayload,
  DrawResponsePayload,
} from '@chess-online/shared';
import { useWebSocket } from './useWebSocket';
import { useGame } from '../store/game.store';

interface UseGameActionsResult {
  makeMove: (from: string, to: string, promotion?: string) => void;
  resign: () => void;
  offerDraw: () => void;
  respondDraw: (accept: boolean) => void;
}

export function useGameActions(): UseGameActionsResult {
  const { send, on, off } = useWebSocket();
  const {
    gameId,
    updateState,
    setGameOver,
    setDrawOffer,
    clearDrawOffer,
    setMoveRejected,
  } = useGame();

  // Use refs for stable callback references
  const gameIdRef = useRef(gameId);
  gameIdRef.current = gameId;

  // ─── Event Listeners ──────────────────────────────────────────────────────

  const handleStateUpdate = useCallback(
    (payload: Record<string, unknown>) => {
      updateState(payload as unknown as GameStateUpdatePayload);
    },
    [updateState],
  );

  const handleGameOver = useCallback(
    (payload: Record<string, unknown>) => {
      setGameOver(payload as unknown as GameOverPayload);
    },
    [setGameOver],
  );

  const handleMoveRejected = useCallback(
    (payload: Record<string, unknown>) => {
      const { reason } = payload as unknown as MoveRejectedPayload;
      setMoveRejected(reason);
    },
    [setMoveRejected],
  );

  const handleDrawOffered = useCallback(
    (_payload: Record<string, unknown>) => {
      setDrawOffer('opponent');
    },
    [setDrawOffer],
  );

  const handleDrawResponse = useCallback(
    (payload: Record<string, unknown>) => {
      const { accepted } = payload as unknown as DrawResponsePayload;
      if (!accepted) {
        clearDrawOffer();
      }
    },
    [clearDrawOffer],
  );

  useEffect(() => {
    on(WsEventType.GAME_STATE_UPDATE, handleStateUpdate);
    on(WsEventType.GAME_OVER, handleGameOver);
    on(WsEventType.MOVE_REJECTED, handleMoveRejected);
    on(WsEventType.DRAW_OFFERED, handleDrawOffered);
    on(WsEventType.DRAW_RESPONSE, handleDrawResponse);

    return () => {
      off(WsEventType.GAME_STATE_UPDATE, handleStateUpdate);
      off(WsEventType.GAME_OVER, handleGameOver);
      off(WsEventType.MOVE_REJECTED, handleMoveRejected);
      off(WsEventType.DRAW_OFFERED, handleDrawOffered);
      off(WsEventType.DRAW_RESPONSE, handleDrawResponse);
    };
  }, [on, off, handleStateUpdate, handleGameOver, handleMoveRejected, handleDrawOffered, handleDrawResponse]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      const id = gameIdRef.current;
      if (!id) return;
      const payload: Record<string, unknown> = { gameId: id, from, to };
      if (promotion) {
        payload.promotion = promotion;
      }
      send(WsEventType.MAKE_MOVE, payload);
    },
    [send],
  );

  const resign = useCallback(() => {
    const id = gameIdRef.current;
    if (!id) return;
    send(WsEventType.RESIGN, { gameId: id });
  }, [send]);

  const offerDraw = useCallback(() => {
    const id = gameIdRef.current;
    if (!id) return;
    setDrawOffer('self');
    send(WsEventType.OFFER_DRAW, { gameId: id });
  }, [send, setDrawOffer]);

  const respondDraw = useCallback(
    (accept: boolean) => {
      const id = gameIdRef.current;
      if (!id) return;
      clearDrawOffer();
      send(WsEventType.RESPOND_DRAW, { gameId: id, accept });
    },
    [send, clearDrawOffer],
  );

  return { makeMove, resign, offerDraw, respondDraw };
}
