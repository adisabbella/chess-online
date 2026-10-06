import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WsEventType, GameFoundPayload, GameStateUpdatePayload } from '@chess-online/shared';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGame } from '../store/game.store';

function Queue(): React.JSX.Element {
  const navigate = useNavigate();
  const { status, send, on, off } = useWebSocket();
  const { setGame, updateState, gameId, gameStatus } = useGame();
  const joinedRef = useRef(false);

  // ─── GAME_FOUND ───────────────────────────────────────────────────────────
  // Normal matchmaking path: server matched us with an opponent.

  const handleGameFound = useCallback(
    (payload: Record<string, unknown>) => {
      const { gameId: foundGameId, color, initialFen } = payload as unknown as GameFoundPayload;
      setGame(foundGameId, color, initialFen);
      navigate(`/game/${foundGameId}`);
    },
    [navigate, setGame],
  );

  // ─── GAME_STATE_UPDATE ────────────────────────────────────────────────────
  // Reconnect path: we already have an active game (restored after server
  // restart or browser refresh). The server sends this immediately on connect.
  // Navigate to the game instead of staying stuck in the queue.

  const handleGameStateUpdate = useCallback(
    (payload: Record<string, unknown>) => {
      const state = payload as unknown as GameStateUpdatePayload;
      if (!state.gameId) return;
      // Restore the full game state in the store so the Game page can render
      updateState(state);
      navigate(`/game/${state.gameId}`);
    },
    [navigate, updateState],
  );

  useEffect(() => {
    on(WsEventType.GAME_FOUND, handleGameFound);
    on(WsEventType.GAME_STATE_UPDATE, handleGameStateUpdate);
    return () => {
      off(WsEventType.GAME_FOUND, handleGameFound);
      off(WsEventType.GAME_STATE_UPDATE, handleGameStateUpdate);
    };
  }, [on, off, handleGameFound, handleGameStateUpdate]);

  // ─── JOIN_QUEUE ───────────────────────────────────────────────────────────
  // Send JOIN_QUEUE only once when the socket opens.
  // If the user already has an active game, the server will send
  // GAME_STATE_UPDATE (handled above) instead of matching them.

  useEffect(() => {
    if (status === 'connected' && !joinedRef.current) {
      joinedRef.current = true;
      send(WsEventType.JOIN_QUEUE);
    }
  }, [status, send]);

  // ─── Redirect if store already has an ACTIVE game (e.g. navigated back) ────
  // Only redirect when the stored game is still active. A finished game's
  // stale gameId must NOT pull the user out of the queue and back to the
  // previous result screen.
  useEffect(() => {
    if (gameId && gameStatus === 'active') {
      navigate(`/game/${gameId}`);
    }
  }, [gameId, gameStatus, navigate]);

  function handleCancel(): void {
    send(WsEventType.LEAVE_QUEUE);
    navigate('/');
  }

  const isConnected = status === 'connected';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center px-4 max-w-xs w-full">
        {/* Animated chess piece */}
        <div className="text-7xl select-none animate-pulse">♟</div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Finding Opponent</h1>
          <p className="text-gray-400 text-base">Searching for a match…</p>
        </div>

        {/* Step indicators */}
        <div className="flex flex-col gap-2 w-full">
          {/* Step 1: Connected */}
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-sm text-gray-300">Joined the queue</span>
          </div>

          {/* Step 2: Searching */}
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? 'bg-indigo-400 animate-pulse' : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Looking for an opponent…' : 'Connecting…'}
            </span>
          </div>

          {/* Step 3: Opponent found (pending) */}
          <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800/50 rounded-lg px-4 py-2.5 opacity-40">
            <div className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
            <span className="text-sm text-gray-500">Opponent found</span>
          </div>
        </div>

        {/* Cancel button */}
        <button
          id="btn-cancel-queue"
          onClick={handleCancel}
          className="px-6 py-2 rounded-lg border border-gray-700 text-gray-400 font-semibold hover:bg-gray-800 hover:text-gray-200 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Queue;

