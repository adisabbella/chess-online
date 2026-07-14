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

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-800">
        Moves
      </h3>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5"
      >
        {movePairs.length === 0 ? (
          <p className="text-gray-600 text-sm italic px-1 py-4 text-center">
            No moves yet
          </p>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.number}
              className="flex items-center text-sm font-mono gap-1"
            >
              <span className="w-8 text-right text-gray-600 shrink-0">
                {pair.number}.
              </span>
              <span className="w-16 px-1 py-0.5 rounded text-gray-200 hover:bg-gray-800 cursor-default">
                {pair.white}
              </span>
              {pair.black && (
                <span className="w-16 px-1 py-0.5 rounded text-gray-400 hover:bg-gray-800 cursor-default">
                  {pair.black}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default React.memo(MoveHistory);
