import React from 'react';
import { PlayerColor } from '@chess-online/shared';
import { getPieceSymbol } from '../../utils/fen';

interface PromotionDialogProps {
  playerColor: PlayerColor;
  onSelect: (piece: string) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES = [
  { key: 'q', label: 'Queen' },
  { key: 'r', label: 'Rook' },
  { key: 'b', label: 'Bishop' },
  { key: 'n', label: 'Knight' },
];

function PromotionDialog({
  playerColor,
  onSelect,
  onCancel,
}: PromotionDialogProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">
          Promote pawn to:
        </h3>
        <div className="flex gap-3">
          {PROMOTION_PIECES.map(({ key, label }) => {
            const fenChar = playerColor === 'white' ? key.toUpperCase() : key;
            return (
              <button
                key={key}
                id={`btn-promote-${key}`}
                onClick={() => onSelect(key)}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 hover:bg-gray-750 transition-colors"
                title={label}
              >
                <span className="text-4xl select-none">{getPieceSymbol(fenChar)}</span>
                <span className="text-xs text-gray-400">{label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default React.memo(PromotionDialog);
