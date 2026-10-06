import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  PlayerColor,
  GameStatus,
  MoveRecord,
  GameStateUpdatePayload,
  GameOverPayload,
} from '@chess-online/shared';

// ─── State ────────────────────────────────────────────────────────────────────

interface GameState {
  gameId: string | null;
  color: PlayerColor | null;
  fen: string | null;
  moveHistory: MoveRecord[];
  turn: PlayerColor | null;
  gameStatus: GameStatus | null;
  isCheck: boolean;
  lastMove: { from: string; to: string } | null;
  gameOverData: GameOverPayload | null;
  drawOffer: { from: 'self' | 'opponent' } | null;
  moveRejectedReason: string | null;
  /** True when the opponent has disconnected and their reconnect timer is running. */
  opponentDisconnected: boolean;
  /** Seconds remaining on the opponent's reconnect timer (as reported by server). */
  opponentDisconnectedRemainingSeconds: number | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type GameAction =
  | { type: 'SET_GAME'; gameId: string; color: PlayerColor; initialFen: string }
  | { type: 'UPDATE_STATE'; payload: GameStateUpdatePayload }
  | { type: 'GAME_OVER'; payload: GameOverPayload }
  | { type: 'SET_DRAW_OFFER'; from: 'self' | 'opponent' }
  | { type: 'CLEAR_DRAW_OFFER' }
  | { type: 'MOVE_REJECTED'; reason: string }
  | { type: 'CLEAR_MOVE_REJECTED' }
  | { type: 'CLEAR_GAME' }
  | { type: 'SET_OPPONENT_DISCONNECTED'; remainingSeconds: number }
  | { type: 'SET_OPPONENT_RECONNECTED' };

// ─── Context Value ────────────────────────────────────────────────────────────

interface GameContextValue extends GameState {
  setGame: (gameId: string, color: PlayerColor, initialFen: string) => void;
  updateState: (payload: GameStateUpdatePayload) => void;
  setGameOver: (payload: GameOverPayload) => void;
  setDrawOffer: (from: 'self' | 'opponent') => void;
  clearDrawOffer: () => void;
  setMoveRejected: (reason: string) => void;
  clearMoveRejected: () => void;
  clearGame: () => void;
  setOpponentDisconnected: (remainingSeconds: number) => void;
  setOpponentReconnected: () => void;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: GameState = {
  gameId: null,
  color: null,
  fen: null,
  moveHistory: [],
  turn: null,
  gameStatus: null,
  isCheck: false,
  lastMove: null,
  gameOverData: null,
  drawOffer: null,
  moveRejectedReason: null,
  opponentDisconnected: false,
  opponentDisconnectedRemainingSeconds: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return {
        ...initialState,
        gameId: action.gameId,
        color: action.color,
        fen: action.initialFen,
        turn: 'white',
        gameStatus: 'active',
      };

    case 'UPDATE_STATE': {
      // When reconnecting after a refresh or server restart, the server sends
      // GAME_STATE_UPDATE with `color` and `gameId`. Use them to restore the
      // game context even if SET_GAME was never called in this browser session.
      //
      // IMPORTANT: During normal gameplay, GAME_STATE_UPDATE is broadcast to
      // BOTH players and `color` is set to the MOVER's color. We must NOT let
      // it overwrite an already-established player color (which would cause
      // Black's client to think it is playing as White after White moves).
      // Only fall back to payload.color when state.color is not yet known.
      const restoredGameId = action.payload.gameId ?? state.gameId;
      const restoredColor = state.color ?? action.payload.color;

      return {
        ...state,
        gameId: restoredGameId,
        color: restoredColor,
        fen: action.payload.fen,
        moveHistory: action.payload.moveHistory,
        turn: action.payload.turn,
        gameStatus: action.payload.gameStatus,
        isCheck: action.payload.isCheck,
        lastMove: action.payload.lastMove
          ? { from: action.payload.lastMove.from, to: action.payload.lastMove.to }
          : null,
        moveRejectedReason: null,
      };
    }

    case 'GAME_OVER':
      return {
        ...state,
        gameOverData: action.payload,
        gameStatus: 'finished',
        drawOffer: null,
        opponentDisconnected: false,
        opponentDisconnectedRemainingSeconds: null,
      };

    case 'SET_DRAW_OFFER':
      return { ...state, drawOffer: { from: action.from } };

    case 'CLEAR_DRAW_OFFER':
      return { ...state, drawOffer: null };

    case 'MOVE_REJECTED':
      return { ...state, moveRejectedReason: action.reason };

    case 'CLEAR_MOVE_REJECTED':
      return { ...state, moveRejectedReason: null };

    case 'CLEAR_GAME':
      return { ...initialState };

    case 'SET_OPPONENT_DISCONNECTED':
      return {
        ...state,
        opponentDisconnected: true,
        opponentDisconnectedRemainingSeconds: action.remainingSeconds,
      };

    case 'SET_OPPONENT_RECONNECTED':
      return {
        ...state,
        opponentDisconnected: false,
        opponentDisconnectedRemainingSeconds: null,
      };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setGame = useCallback(
    (gameId: string, color: PlayerColor, initialFen: string) => {
      dispatch({ type: 'SET_GAME', gameId, color, initialFen });
    },
    [],
  );

  const updateState = useCallback(
    (payload: GameStateUpdatePayload) => {
      dispatch({ type: 'UPDATE_STATE', payload });
    },
    [],
  );

  const setGameOver = useCallback(
    (payload: GameOverPayload) => {
      dispatch({ type: 'GAME_OVER', payload });
    },
    [],
  );

  const setDrawOffer = useCallback(
    (from: 'self' | 'opponent') => {
      dispatch({ type: 'SET_DRAW_OFFER', from });
    },
    [],
  );

  const clearDrawOffer = useCallback(() => {
    dispatch({ type: 'CLEAR_DRAW_OFFER' });
  }, []);

  const setMoveRejected = useCallback(
    (reason: string) => {
      dispatch({ type: 'MOVE_REJECTED', reason });
    },
    [],
  );

  const clearMoveRejected = useCallback(() => {
    dispatch({ type: 'CLEAR_MOVE_REJECTED' });
  }, []);

  const clearGame = useCallback(() => {
    dispatch({ type: 'CLEAR_GAME' });
  }, []);

  const setOpponentDisconnected = useCallback((remainingSeconds: number) => {
    dispatch({ type: 'SET_OPPONENT_DISCONNECTED', remainingSeconds });
  }, []);

  const setOpponentReconnected = useCallback(() => {
    dispatch({ type: 'SET_OPPONENT_RECONNECTED' });
  }, []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        setGame,
        updateState,
        setGameOver,
        setDrawOffer,
        clearDrawOffer,
        setMoveRejected,
        clearMoveRejected,
        clearGame,
        setOpponentDisconnected,
        setOpponentReconnected,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return ctx;
}
