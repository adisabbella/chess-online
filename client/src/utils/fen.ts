/**
 * Parses a FEN string into a 2D board array for rendering.
 * This is NOT chess logic — it's string parsing for display only.
 */

export interface SquareData {
  piece: string | null;   // FEN character: 'P', 'p', 'R', 'r', etc.
  square: string;         // algebraic notation: 'a1', 'h8', etc.
}

export type BoardRow = SquareData[];
export type Board = BoardRow[];

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function parseFen(fen: string): Board {
  const boardPart = fen.split(' ')[0];
  const ranks = boardPart.split('/');
  const board: Board = [];

  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const row: BoardRow = [];
    const rank = ranks[rankIndex];
    let fileIndex = 0;

    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          const square = `${FILES[fileIndex]}${8 - rankIndex}`;
          row.push({ piece: null, square });
          fileIndex++;
        }
      } else {
        const square = `${FILES[fileIndex]}${8 - rankIndex}`;
        row.push({ piece: char, square });
        fileIndex++;
      }
    }

    board.push(row);
  }

  return board;
}

/**
 * Maps a FEN piece character to a Unicode chess symbol.
 */
const PIECE_UNICODE: Record<string, string> = {
  K: '♔',
  Q: '♕',
  R: '♖',
  B: '♗',
  N: '♘',
  P: '♙',
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

export function getPieceSymbol(fenChar: string): string {
  return PIECE_UNICODE[fenChar] ?? '';
}

/**
 * Returns true if the FEN character represents a white piece.
 */
export function isWhitePiece(fenChar: string): boolean {
  return fenChar >= 'A' && fenChar <= 'Z';
}
