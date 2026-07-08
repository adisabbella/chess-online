import React, { createContext, useContext, useReducer } from 'react';
import { PlayerColor } from '@chess-online/shared';

interface GameState {
  gameId: string | null;
  color: PlayerColor | null;
  initialFen: string | null;
}

type GameAction =
  | { type: 'SET_GAME'; gameId: string; color: PlayerColor; initialFen: string }
  | { type: 'CLEAR_GAME' };

interface GameContextValue extends GameState {
  setGame: (gameId: string, color: PlayerColor, initialFen: string) => void;
  clearGame: () => void;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME':
      return { gameId: action.gameId, color: action.color, initialFen: action.initialFen };
    case 'CLEAR_GAME':
      return { gameId: null, color: null, initialFen: null };
    default:
      return state;
  }
}

const GameContext = createContext<GameContextValue | null>(null);

const initialState: GameState = { gameId: null, color: null, initialFen: null };

export function GameProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  function setGame(gameId: string, color: PlayerColor, initialFen: string): void {
    dispatch({ type: 'SET_GAME', gameId, color, initialFen });
  }

  function clearGame(): void {
    dispatch({ type: 'CLEAR_GAME' });
  }

  return (
    <GameContext.Provider value={{ ...state, setGame, clearGame }}>
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
