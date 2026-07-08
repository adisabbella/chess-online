import React from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../store/game.store';

function Game(): React.JSX.Element {
  const { gameId } = useParams<{ gameId: string }>();
  const { color, initialFen } = useGame();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center px-4 max-w-md w-full">
        <div className="text-6xl select-none">♟</div>

        <h1 className="text-3xl font-bold tracking-tight">Game Created</h1>

        <div className="w-full bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-400 text-sm font-medium">Game ID</span>
            <span className="text-white font-mono text-xs break-all text-right max-w-[60%]">
              {gameId ?? '—'}
            </span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-400 text-sm font-medium">Your Color</span>
            <span
              className={`font-semibold capitalize ${
                color === 'white' ? 'text-gray-100' : 'text-gray-500'
              }`}
            >
              {color ?? '—'}
            </span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-400 text-sm font-medium">Starting FEN</span>
            <span className="text-gray-500 font-mono text-xs break-all text-right max-w-[60%]">
              {initialFen ?? '—'}
            </span>
          </div>
        </div>

        <p className="text-gray-500 text-sm italic">Waiting for gameplay implementation…</p>
      </div>
    </div>
  );
}

export default Game;
