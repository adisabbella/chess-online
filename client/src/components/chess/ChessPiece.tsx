import React from 'react';
import { getPieceSymbol, isWhitePiece } from '../../utils/fen';

interface ChessPieceProps {
  fenChar: string;
}

function ChessPiece({ fenChar }: ChessPieceProps): React.JSX.Element {
  const symbol = getPieceSymbol(fenChar);
  const isWhite = isWhitePiece(fenChar);

  return (
    <span
      className={`select-none leading-none ${
        isWhite ? 'text-white' : 'text-gray-900'
      }`}
      style={{
        fontSize: 'clamp(1.25rem, 5.5vw, 2.25rem)',
        filter: isWhite
          ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
          : 'drop-shadow(0 1px 2px rgba(255,255,255,0.3))',
      }}
    >
      {symbol}
    </span>
  );
}

export default React.memo(ChessPiece);
