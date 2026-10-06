import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '@chess-online/shared';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

function MoveHistory({ moves }: MoveHistoryProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into pairs (white + black per row)
  const movePairs: Array<{ number: number; white: string; black?: string }> = [];

  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i];
    const black = moves[i + 1];
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: white.san,
      black: black?.san,
    });
  }

  // Index of the last half-move (used to highlight it)
  const lastMoveIndex = moves.length - 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-gray-800 px-2 py-1.5">
        <span className="w-8 shrink-0" />
        <span className="w-16 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          White
        </span>
        <span className="w-16 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Black
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5"
      >
        {movePairs.length === 0 ? (
          <p className="text-gray-600 text-sm italic px-1 py-4 text-center">
            No moves yet
          </p>
        ) : (
          movePairs.map((pair, pairIndex) => {
            const whiteIndex = pairIndex * 2;
            const blackIndex = pairIndex * 2 + 1;
            const isWhiteLast = lastMoveIndex === whiteIndex;
            const isBlackLast = lastMoveIndex === blackIndex;
            return (
              <div
                key={pair.number}
                className="flex items-center text-sm font-mono gap-1"
              >
                <span className="w-8 text-right text-gray-600 shrink-0">
                  {pair.number}.
                </span>
                <span
                  className={`w-16 px-1 py-0.5 rounded cursor-default transition-colors ${
                    isWhiteLast
                      ? 'bg-indigo-900/60 text-indigo-200 font-semibold'
                      : 'text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {pair.white}
                </span>
                {pair.black !== undefined && (
                  <span
                    className={`w-16 px-1 py-0.5 rounded cursor-default transition-colors ${
                      isBlackLast
                        ? 'bg-indigo-900/60 text-indigo-200 font-semibold'
                        : 'text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    {pair.black}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default React.memo(MoveHistory);
