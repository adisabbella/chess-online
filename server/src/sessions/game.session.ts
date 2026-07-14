import {
  PlayerColor,
  GameStatus,
  GameResult,
  GameEndReason,
  MoveRecord,
  GameStateUpdatePayload,
  GameOverPayload,
} from '@chess-online/shared';
import { ChessService } from '../services/chess.service';

// ─── Result Types ─────────────────────────────────────────────────────────────

interface MoveSuccess {
  type: 'accepted';
  stateUpdate: GameStateUpdatePayload;
}

interface MoveGameOver {
  type: 'game_over';
  stateUpdate: GameStateUpdatePayload;
  gameOver: GameOverPayload;
}

interface MoveRejection {
  type: 'rejected';
  reason: string;
}

export type MoveResult = MoveSuccess | MoveGameOver | MoveRejection;

interface ResignResult {
  type: 'game_over';
  gameOver: GameOverPayload;
}

interface DrawOfferSuccess {
  type: 'offered';
  offeredByColor: PlayerColor;
}

interface DrawOfferRejection {
  type: 'rejected';
  reason: string;
}

export type DrawOfferResult = DrawOfferSuccess | DrawOfferRejection;

interface DrawAccepted {
  type: 'game_over';
  gameOver: GameOverPayload;
}

interface DrawDeclined {
  type: 'declined';
}

interface DrawRespondRejection {
  type: 'rejected';
  reason: string;
}

export type DrawRespondResult = DrawAccepted | DrawDeclined | DrawRespondRejection;

// ─── GameSession Class ────────────────────────────────────────────────────────

export class GameSession {
  readonly gameId: string;
  readonly whitePlayerId: string;
  readonly blackPlayerId: string;
  readonly createdAt: Date;

  private chess: ChessService;
  private _moveHistory: MoveRecord[] = [];
  private _status: GameStatus = 'active';
  private _drawOffer: { offeredBy: string } | null = null;

  constructor(gameId: string, whitePlayerId: string, blackPlayerId: string) {
    this.gameId = gameId;
    this.whitePlayerId = whitePlayerId;
    this.blackPlayerId = blackPlayerId;
    this.createdAt = new Date();
    this.chess = new ChessService();
  }

  get status(): GameStatus {
    return this._status;
  }

  get moveHistory(): ReadonlyArray<MoveRecord> {
    return this._moveHistory;
  }

  getPlayerColor(userId: string): PlayerColor | null {
    if (userId === this.whitePlayerId) return 'white';
    if (userId === this.blackPlayerId) return 'black';
    return null;
  }

  private isPlayerTurn(userId: string): boolean {
    const turn = this.chess.getTurn();
    if (turn === 'w' && userId === this.whitePlayerId) return true;
    if (turn === 'b' && userId === this.blackPlayerId) return true;
    return false;
  }

  private getCurrentTurn(): PlayerColor {
    return this.chess.getTurn() === 'w' ? 'white' : 'black';
  }

  private getOpponentId(userId: string): string {
    return userId === this.whitePlayerId ? this.blackPlayerId : this.whitePlayerId;
  }

  // ─── Make Move ────────────────────────────────────────────────────────────

  makeMove(userId: string, from: string, to: string, promotion?: string): MoveResult {
    if (this._status !== 'active') {
      return { type: 'rejected', reason: 'Game is not active' };
    }

    const color = this.getPlayerColor(userId);
    if (!color) {
      return { type: 'rejected', reason: 'Player does not belong to this game' };
    }

    if (!this.isPlayerTurn(userId)) {
      return { type: 'rejected', reason: 'It is not your turn' };
    }

    const validPromotion = promotion ?? 'q';
    const moveResult = this.chess.tryMove(from, to, validPromotion);
    if (!moveResult) {
      return { type: 'rejected', reason: 'Illegal move' };
    }

    // Record the move
    const record: MoveRecord = {
      moveNumber: this.chess.getMoveNumber(),
      from: moveResult.from,
      to: moveResult.to,
      san: moveResult.san,
      fen: this.chess.getFen(),
    };
    this._moveHistory.push(record);

    // Clear any pending draw offer after a move
    this._drawOffer = null;

    // Check for game end
    const gameOverData = this.detectGameEnd();
    if (gameOverData) {
      this._status = 'finished';
      return {
        type: 'game_over',
        stateUpdate: this.buildStateUpdate(moveResult.from, moveResult.to, moveResult.san),
        gameOver: gameOverData,
      };
    }

    return {
      type: 'accepted',
      stateUpdate: this.buildStateUpdate(moveResult.from, moveResult.to, moveResult.san),
    };
  }

  // ─── Resign ───────────────────────────────────────────────────────────────

  resign(userId: string): MoveRejection | ResignResult {
    if (this._status !== 'active') {
      return { type: 'rejected', reason: 'Game is not active' };
    }

    const color = this.getPlayerColor(userId);
    if (!color) {
      return { type: 'rejected', reason: 'Player does not belong to this game' };
    }

    this._status = 'finished';
    const winnerId = this.getOpponentId(userId);
    const result: GameResult = winnerId === this.whitePlayerId ? 'WHITE_WIN' : 'BLACK_WIN';

    return {
      type: 'game_over',
      gameOver: {
        gameId: this.gameId,
        result,
        reason: 'RESIGN',
        winner: winnerId,
        finalFen: this.chess.getFen(),
      },
    };
  }

  // ─── Draw Offers ──────────────────────────────────────────────────────────

  offerDraw(userId: string): DrawOfferResult {
    if (this._status !== 'active') {
      return { type: 'rejected', reason: 'Game is not active' };
    }

    const color = this.getPlayerColor(userId);
    if (!color) {
      return { type: 'rejected', reason: 'Player does not belong to this game' };
    }

    if (this._drawOffer) {
      return { type: 'rejected', reason: 'A draw offer is already pending' };
    }

    this._drawOffer = { offeredBy: userId };

    return {
      type: 'offered',
      offeredByColor: color,
    };
  }

  respondDraw(userId: string, accept: boolean): DrawRespondResult {
    if (this._status !== 'active') {
      return { type: 'rejected', reason: 'Game is not active' };
    }

    const color = this.getPlayerColor(userId);
    if (!color) {
      return { type: 'rejected', reason: 'Player does not belong to this game' };
    }

    if (!this._drawOffer) {
      return { type: 'rejected', reason: 'No draw offer to respond to' };
    }

    if (this._drawOffer.offeredBy === userId) {
      return { type: 'rejected', reason: 'Cannot respond to your own draw offer' };
    }

    if (accept) {
      this._status = 'finished';
      this._drawOffer = null;
      return {
        type: 'game_over',
        gameOver: {
          gameId: this.gameId,
          result: 'DRAW',
          reason: 'DRAW_AGREEMENT',
          winner: null,
          finalFen: this.chess.getFen(),
        },
      };
    }

    this._drawOffer = null;
    return { type: 'declined' };
  }

  // ─── State Builders ───────────────────────────────────────────────────────

  getInitialFen(): string {
    return this.chess.getFen();
  }

  private buildStateUpdate(from: string, to: string, san: string): GameStateUpdatePayload {
    return {
      gameId: this.gameId,
      fen: this.chess.getFen(),
      lastMove: { from, to, san },
      moveHistory: [...this._moveHistory],
      turn: this.getCurrentTurn(),
      gameStatus: this._status,
      isCheck: this.chess.inCheck(),
    };
  }

  private detectGameEnd(): GameOverPayload | null {
    if (this.chess.isCheckmate()) {
      // The side to move is checkmated, so the OTHER side wins
      const turn = this.chess.getTurn();
      const winner = turn === 'w' ? this.blackPlayerId : this.whitePlayerId;
      const result: GameResult = turn === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
      return {
        gameId: this.gameId,
        result,
        reason: 'CHECKMATE',
        winner,
        finalFen: this.chess.getFen(),
      };
    }

    if (this.chess.isStalemate()) {
      return {
        gameId: this.gameId,
        result: 'DRAW',
        reason: 'STALEMATE',
        winner: null,
        finalFen: this.chess.getFen(),
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        gameId: this.gameId,
        result: 'DRAW',
        reason: 'INSUFFICIENT_MATERIAL',
        winner: null,
        finalFen: this.chess.getFen(),
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        gameId: this.gameId,
        result: 'DRAW',
        reason: 'THREEFOLD_REPETITION',
        winner: null,
        finalFen: this.chess.getFen(),
      };
    }

    if (this.chess.isDrawByFiftyMoves()) {
      return {
        gameId: this.gameId,
        result: 'DRAW',
        reason: 'FIFTY_MOVE_RULE',
        winner: null,
        finalFen: this.chess.getFen(),
      };
    }

    return null;
  }
}
