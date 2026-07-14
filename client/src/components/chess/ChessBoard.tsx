import React, { useState, useCallback, useMemo } from 'react';
import { parseFen, isWhitePiece } from '../../utils/fen';
import { PlayerColor } from '@chess-online/shared';
import ChessPiece from './ChessPiece';

interface ChessBoardProps {
  fen: string;
  playerColor: PlayerColor;
  turn: PlayerColor | null;
  isCheck: boolean;
  lastMove: { from: string; to: string } | null;
  gameActive: boolean;
  onMove: (from: string, to: string) => void;
  onPromotion: (from: string, to: string) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function isPromotionMove(
  piece: string | null,
  to: string,
  playerColor: PlayerColor,
): boolean {
  if (!piece) return false;
  const isPawn = piece.toLowerCase() === 'p';
  if (!isPawn) return false;
  const toRank = to[1];
  if (playerColor === 'white' && isWhitePiece(piece) && toRank === '8') return true;
  if (playerColor === 'black' && !isWhitePiece(piece) && toRank === '1') return true;
  return false;
}

function ChessBoard({
  fen,
  playerColor,
  turn,
  isCheck,
  lastMove,
  gameActive,
  onMove,
  onPromotion,
}: ChessBoardProps): React.JSX.Element {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const board = useMemo(() => parseFen(fen), [fen]);

  const isMyTurn = turn === playerColor && gameActive;

  const pieceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of board) {
      for (const sq of row) {
        if (sq.piece) {
          map.set(sq.square, sq.piece);
        }
      }
    }
    return map;
  }, [board]);

  const checkedKingSquare = useMemo(() => {
    if (!isCheck) return null;
    const kingChar = turn === 'white' ? 'K' : 'k';
    for (const row of board) {
      for (const sq of row) {
        if (sq.piece === kingChar) return sq.square;
      }
    }
    return null;
  }, [isCheck, turn, board]);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (!isMyTurn) return;

      const clickedPiece = pieceMap.get(square) ?? null;

      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        if (clickedPiece) {
          const isOwnPiece =
            (playerColor === 'white' && isWhitePiece(clickedPiece)) ||
            (playerColor === 'black' && !isWhitePiece(clickedPiece));
          if (isOwnPiece) {
            setSelectedSquare(square);
            return;
          }
        }

        const fromPiece = pieceMap.get(selectedSquare) ?? null;
        if (isPromotionMove(fromPiece, square, playerColor)) {
          onPromotion(selectedSquare, square);
        } else {
          onMove(selectedSquare, square);
        }
        setSelectedSquare(null);
        return;
      }

      if (clickedPiece) {
        const isOwnPiece =
          (playerColor === 'white' && isWhitePiece(clickedPiece)) ||
          (playerColor === 'black' && !isWhitePiece(clickedPiece));
        if (isOwnPiece) {
          setSelectedSquare(square);
        }
      }
    },
    [selectedSquare, isMyTurn, playerColor, pieceMap, onMove, onPromotion],
  );

  const displayBoard = useMemo(() => {
    if (playerColor === 'black') {
      return board.map((row) => [...row].reverse()).reverse();
    }
    return board;
  }, [board, playerColor]);

  const displayFiles = playerColor === 'black' ? [...FILES].reverse() : FILES;
  const displayRanks = playerColor === 'black' ? [...RANKS].reverse() : RANKS;

  return (
    /*
     * The outer wrapper is `w-full` so it naturally fills the space given by
     * its parent. We cap it at a comfortable desktop size with `max-w-[560px]`
     * so the board never stretches excessively on very wide screens.
     *
     * Inside we use a CSS aspect-ratio trick: the board area is kept 1:1 via
     * an `aspect-square` container, and each of the 9 columns (1 label + 8
     * squares) is sized with CSS grid so they scale together.
     */
    <div className="w-full max-w-[560px] mx-auto select-none">
      <div className="border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl">
        {displayBoard.map((row, rowIndex) => (
          /*
           * Each rank row: one narrow label column + 8 equal square columns.
           * `grid-cols-[24px_repeat(8,1fr)]` gives the rank label a fixed
           * 24 px width and lets the 8 squares share the rest equally.
           */
          <div
            key={rowIndex}
            className="grid"
            style={{ gridTemplateColumns: '24px repeat(8, 1fr)' }}
          >
            {/* Rank label */}
            <div className="flex items-center justify-center text-xs text-gray-500 font-mono bg-gray-900">
              {displayRanks[rowIndex]}
            </div>

            {row.map((sq) => {
              const file = FILES.indexOf(sq.square[0]);
              const rank = parseInt(sq.square[1], 10);
              const isLight = (file + rank) % 2 !== 0;

              const isSelected = sq.square === selectedSquare;
              const isLastMoveSquare =
                lastMove &&
                (sq.square === lastMove.from || sq.square === lastMove.to);
              const isKingInCheck = sq.square === checkedKingSquare;

              let bgColor = isLight ? 'bg-amber-100' : 'bg-amber-800';
              if (isSelected) bgColor = 'bg-indigo-400';
              else if (isKingInCheck) bgColor = 'bg-red-500';
              else if (isLastMoveSquare)
                bgColor = isLight ? 'bg-yellow-200' : 'bg-yellow-600';

              return (
                /*
                 * `aspect-square` keeps every square perfectly 1:1 regardless
                 * of how wide the board is on any device.
                 */
                <div
                  key={sq.square}
                  id={`square-${sq.square}`}
                  className={`aspect-square flex items-center justify-center cursor-pointer transition-colors ${bgColor} hover:brightness-110`}
                  onClick={() => handleSquareClick(sq.square)}
                >
                  {sq.piece && <ChessPiece fenChar={sq.piece} />}
                </div>
              );
            })}
          </div>
        ))}

        {/* File labels row — same grid layout as rank rows */}
        <div
          className="grid"
          style={{ gridTemplateColumns: '24px repeat(8, 1fr)' }}
        >
          <div className="bg-gray-900" />
          {displayFiles.map((file) => (
            <div
              key={file}
              className="flex items-center justify-center text-xs text-gray-500 font-mono bg-gray-900 py-1"
            >
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChessBoard);
