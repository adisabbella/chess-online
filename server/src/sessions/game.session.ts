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

// ─── Restore Data ─────────────────────────────────────────────────────────────

/**
 * Data required to reconstruct a GameSession from persistent storage.
 * All fields come directly from the database — no chess logic is re-run.
 */
export interface RestoreData {
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  currentFen: string;
  moveHistory: MoveRecord[];
  createdAt: Date;
}

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

  /**
   * Disconnect timers — keyed by userId.
   * Each timer fires when the 60-second reconnect window expires.
   * The callback is provided by GameManager (keeps GameSession free of service deps).
   */
  private disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // ─── Constructors ──────────────────────────────────────────────────────────

  constructor(
    gameId: string,
    whitePlayerId: string,
    blackPlayerId: string,
    restoredFen?: string,
    restoredHistory?: MoveRecord[],
    restoredCreatedAt?: Date,
  ) {
    this.gameId = gameId;
    this.whitePlayerId = whitePlayerId;
    this.blackPlayerId = blackPlayerId;
    this.createdAt = restoredCreatedAt ?? new Date();
    this.chess = new ChessService(restoredFen);
    if (restoredHistory) {
      this._moveHistory = [...restoredHistory];
    }
  }

  /**
   * Reconstructs a GameSession from persisted data.
   * Uses the stored FEN directly — no move replay required.
   * Move history is set from the DB records.
   */
  static restore(data: RestoreData): GameSession {
    const session = new GameSession(
      data.gameId,
      data.whitePlayerId,
      data.blackPlayerId,
      data.currentFen,
      data.moveHistory,
      data.createdAt,
    );

    console.log(
      `[game.session] restored session ${data.gameId} — fen: ${data.currentFen.substring(0, 30)}...`,
    );

    return session;
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

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

  // ─── Disconnect Timer Management ───────────────────────────────────────────

  /**
   * Marks the player as disconnected by starting a 60-second abandon timer.
   * If the timer fires, `onExpire` is called with the userId so that
   * GameManager can end the game and update stats — keeping this class
   * free of persistence and broadcast concerns.
   */
  markDisconnected(userId: string, onExpire: (userId: string) => void): void {
    // Clear any existing timer for this user (safety guard)
    this.cancelDisconnectTimer(userId);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(userId);
      onExpire(userId);
    }, 60_000);

    this.disconnectTimers.set(userId, timer);
    console.log(`[game.session] disconnect timer started for user ${userId} in game ${this.gameId}`);
  }

  /**
   * Cancels a pending disconnect timer for the given userId.
   * Called when the player reconnects within the window.
   */
  cancelDisconnectTimer(userId: string): void {
    const existing = this.disconnectTimers.get(userId);
    if (existing !== undefined) {
      clearTimeout(existing);
      this.disconnectTimers.delete(userId);
      console.log(
        `[game.session] disconnect timer cancelled for user ${userId} in game ${this.gameId}`,
      );
    }
  }

  /** Returns true if the player currently has a pending disconnect timer. */
  isDisconnected(userId: string): boolean {
    return this.disconnectTimers.has(userId);
  }

  /**
   * Cancels all active disconnect timers.
   * Called when the game ends (resign, checkmate, etc.) to prevent spurious
   * abandon callbacks firing after game removal.
   */
  cancelAllDisconnectTimers(): void {
    for (const [userId, timer] of this.disconnectTimers) {
      clearTimeout(timer);
      console.log(
        `[game.session] cleared timer for ${userId} on game end (game ${this.gameId})`,
      );
    }
    this.disconnectTimers.clear();
  }

  // ─── State Builders ───────────────────────────────────────────────────────

  getInitialFen(): string {
    return this.chess.getFen();
  }

  /**
   * Returns a full game-state restore payload for a reconnecting player.
   * Includes `color` so the client can determine which side they are playing
   * without a prior GAME_FOUND event.
   *
   * `lastMove` is null when no moves have been made yet.
   */
  getFullState(userId: string): GameStateUpdatePayload | null {
    const color = this.getPlayerColor(userId);
    if (!color) return null;

    const lastMove =
      this._moveHistory.length > 0
        ? (this._moveHistory[this._moveHistory.length - 1] as MoveRecord)
        : null;

    return {
      gameId: this.gameId,
      fen: this.chess.getFen(),
      lastMove: lastMove
        ? { from: lastMove.from, to: lastMove.to, san: lastMove.san }
        : null,
      moveHistory: [...this._moveHistory],
      turn: this.getCurrentTurn(),
      gameStatus: this._status,
      isCheck: this.chess.inCheck(),
      color,
    };
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
      this.cancelAllDisconnectTimers();
      return {
        type: 'game_over',
        stateUpdate: this.buildStateUpdate(moveResult.from, moveResult.to, moveResult.san, color),
        gameOver: gameOverData,
      };
    }

    return {
      type: 'accepted',
      stateUpdate: this.buildStateUpdate(moveResult.from, moveResult.to, moveResult.san, color),
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
    this.cancelAllDisconnectTimers();

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
      this.cancelAllDisconnectTimers();
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

  // ─── Private Helpers ──────────────────────────────────────────────────────

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

  private buildStateUpdate(
    from: string,
    to: string,
    san: string,
    color: PlayerColor,
  ): GameStateUpdatePayload {
    return {
      gameId: this.gameId,
      fen: this.chess.getFen(),
      lastMove: { from, to, san },
      moveHistory: [...this._moveHistory],
      turn: this.getCurrentTurn(),
      gameStatus: this._status,
      isCheck: this.chess.inCheck(),
      color,
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
