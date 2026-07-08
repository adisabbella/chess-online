import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WsEventType, GameFoundPayload } from '@chess-online/shared';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGame } from '../store/game.store';

function Queue(): React.JSX.Element {
  const navigate = useNavigate();
  const { status, send, on, off } = useWebSocket();
  const { setGame } = useGame();
  const joinedRef = useRef(false);

  const handleGameFound = useCallback(
    (payload: Record<string, unknown>) => {
      const { gameId, color, initialFen } = payload as unknown as GameFoundPayload;
      setGame(gameId, color, initialFen);
      navigate(`/game/${gameId}`);
    },
    [navigate, setGame],
  );

  // Register the GAME_FOUND listener once on mount
  useEffect(() => {
    on(WsEventType.GAME_FOUND, handleGameFound);
    return () => {
      off(WsEventType.GAME_FOUND, handleGameFound);
    };
  }, [on, off, handleGameFound]);

  // Send JOIN_QUEUE only when the socket is confirmed open, exactly once
  useEffect(() => {
    if (status === 'connected' && !joinedRef.current) {
      joinedRef.current = true;
      send(WsEventType.JOIN_QUEUE);
    }
  }, [status, send]);

  function handleCancel(): void {
    send(WsEventType.LEAVE_QUEUE);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center px-4">
        <div className="text-7xl select-none animate-pulse">♟</div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Finding Opponent</h1>
          <p className="text-gray-400 text-lg">Searching for a match…</p>
        </div>

        <div className="flex items-center gap-3 text-gray-400 text-sm font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-indigo-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
            }`}
          />
          {status === 'connected' ? 'In queue' : 'Connecting…'}
        </div>

        <button
          id="btn-cancel-queue"
          onClick={handleCancel}
          className="px-5 py-2 rounded-lg border border-gray-600 text-gray-300 font-semibold hover:bg-gray-800 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Queue;
