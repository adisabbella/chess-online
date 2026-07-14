import { Chess } from 'chess.js';

interface ChessMoveResult {
  from: string;
  to: string;
  san: string;
  color: string;
  piece: string;
  promotion?: string;
  captured?: string;
}

export class ChessService {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  tryMove(from: string, to: string, promotion?: string): ChessMoveResult | null {
    try {
      const moveInput: { from: string; to: string; promotion?: string } = { from, to };
      if (promotion) {
        moveInput.promotion = promotion;
      }
      const result = this.chess.move(moveInput);
      return {
        from: result.from,
        to: result.to,
        san: result.san,
        color: result.color,
        piece: result.piece,
        promotion: result.promotion,
        captured: result.captured,
      };
    } catch {
      return null;
    }
  }

  getFen(): string {
    return this.chess.fen();
  }

  getTurn(): 'w' | 'b' {
    return this.chess.turn();
  }

  getMoveNumber(): number {
    return this.chess.moveNumber();
  }

  inCheck(): boolean {
    return this.chess.inCheck();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  isStalemate(): boolean {
    return this.chess.isStalemate();
  }

  isDraw(): boolean {
    return this.chess.isDraw();
  }

  isInsufficientMaterial(): boolean {
    return this.chess.isInsufficientMaterial();
  }

  isThreefoldRepetition(): boolean {
    return this.chess.isThreefoldRepetition();
  }

  isDrawByFiftyMoves(): boolean {
    return this.chess.isDrawByFiftyMoves();
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }
}
