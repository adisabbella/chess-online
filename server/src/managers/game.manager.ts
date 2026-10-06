import crypto from 'crypto';
import WebSocket from 'ws';
import { GameResult as PrismaGameResult } from '@prisma/client';
import {
  GameOverPayload,
  WsEventType,
  PlayerDisconnectedPayload,
  PlayerReconnectedPayload,
  MoveRecord,
} from '@chess-online/shared';
import { GameSession, MoveResult, DrawOfferResult, DrawRespondResult, RestoreData } from '../sessions/game.session';
import { gameSessionManager } from './gameSession.manager';
import { persistenceService } from '../services/persistence.service';
import { gameRepository } from '../repositories/game.repository';
import { moveRepository } from '../repositories/move.repository';
import { connectionManager } from './connection.manager';

// ─── Local Types ──────────────────────────────────────────────────────────────

interface ResignSuccess {
  type: 'game_over';
  gameOver: GameOverPayload;
}

interface ActionRejection {
  type: 'rejected';
  reason: string;
}

type ResignResult = ResignSuccess | ActionRejection;

const DISCONNECT_TIMEOUT_SECONDS = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toPrismaResult(result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW'): PrismaGameResult {
  return result as PrismaGameResult;
}

function sendToSocket(socket: WebSocket, type: string, payload: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

function sendToUser(userId: string, type: string, payload: object): void {
  const socket = connectionManager.getConnection(userId);
  if (socket) sendToSocket(socket, type, payload);
}

function broadcastToGame(session: GameSession, type: string, payload: object): void {
  sendToUser(session.whitePlayerId, type, payload);
  sendToUser(session.blackPlayerId, type, payload);
}

// ─── Game Manager ─────────────────────────────────────────────────────────────

class GameManager {
  /**
   * Creates a new in-memory GameSession and persists the corresponding Game record.
   * Throws if persistence fails — callers must handle the error.
   */
  async createGame(playerAId: string, playerBId: string): Promise<GameSession> {
    const gameId = crypto.randomUUID();

    const [whitePlayerId, blackPlayerId] =
      Math.random() < 0.5 ? [playerAId, playerBId] : [playerBId, playerAId];

    const session = new GameSession(gameId, whitePlayerId, blackPlayerId);
    gameSessionManager.registerSession(session);

    await persistenceService.createGame(session);

    console.log(
      `[game] created game ${gameId} — white: ${whitePlayerId}, black: ${blackPlayerId}`,
    );

    return session;
  }

  /**
   * Applies a move in-memory and returns the result immediately.
   * Persistence runs after — a DB failure is logged but does NOT block the move
   * or leave the in-memory state inconsistent with clients.
   *
   * Design rationale:
   *   - GameSession is the source of truth during gameplay.
   *   - chess.js cannot be "un-moved" safely after an accepted move.
   *   - If persistence fails, clients still receive the correct game state.
   */
  async handleMove(
    userId: string,
    gameId: string,
    from: string,
    to: string,
    promotion?: string,
  ): Promise<MoveResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.makeMove(userId, from, to, promotion);

    // Rejected moves have no side effects — return immediately, nothing to persist.
    if (result.type === 'rejected') {
      return result;
    }

    // Move was accepted in-memory. Persist asynchronously — errors are logged
    // but must not suppress the result returned to the handler.
    const lastMove = session.moveHistory[session.moveHistory.length - 1];

    const persistMovePromise = persistenceService.persistMove(gameId, lastMove).catch((err) => {
      console.error(`[game] failed to persist move in game ${gameId}:`, err);
    });

    if (result.type === 'game_over') {
      const { winner, result: gameResult } = result.gameOver;

      // Wait for move persistence before finishing the game record
      await persistMovePromise;

      persistenceService
        .finishGame(
          gameId,
          session.whitePlayerId,
          session.blackPlayerId,
          toPrismaResult(gameResult),
          winner,
          result.gameOver.finalFen,
        )
        .catch((err) => {
          console.error(`[game] failed to persist game-over for game ${gameId}:`, err);
        });
    }

    return result;
  }

  /**
   * Processes a resignation and persists the game result.
   * Returns the result immediately; persistence runs after.
   */
  async handleResign(userId: string, gameId: string): Promise<ResignResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.resign(userId);

    if (result.type === 'rejected') {
      return result;
    }

    const { winner, result: gameResult } = result.gameOver;
    persistenceService
      .finishGame(
        gameId,
        session.whitePlayerId,
        session.blackPlayerId,
        toPrismaResult(gameResult),
        winner,
        result.gameOver.finalFen,
      )
      .catch((err) => {
        console.error(`[game] failed to persist resignation for game ${gameId}:`, err);
      });

    return result;
  }

  handleOfferDraw(userId: string, gameId: string): DrawOfferResult {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }
    return session.offerDraw(userId);
  }

  /**
   * Processes a draw response; persists the game result if draw is accepted.
   */
  async handleRespondDraw(userId: string, gameId: string, accept: boolean): Promise<DrawRespondResult> {
    const session = gameSessionManager.getSession(gameId);
    if (!session) {
      return { type: 'rejected', reason: 'Game not found' };
    }

    const result = session.respondDraw(userId, accept);

    if (result.type === 'game_over') {
      persistenceService
        .finishGame(
          gameId,
          session.whitePlayerId,
          session.blackPlayerId,
          'DRAW',
          null,
          result.gameOver.finalFen,
        )
        .catch((err) => {
          console.error(`[game] failed to persist draw agreement for game ${gameId}:`, err);
        });
    }

    return result;
  }

  // ─── Disconnect Handling ────────────────────────────────────────────────────

  /**
   * Called by ConnectionManager when a player's WebSocket closes.
   *
   * If the player is in an active game:
   *   - Starts a 60-second reconnect timer on the GameSession.
   *   - Notifies the opponent.
   *
   * If the timer fires without reconnection, the game ends by abandonment.
   */
  handleDisconnect(userId: string): void {
    const session = gameSessionManager.getSessionByUser(userId);
    if (!session || session.status !== 'active') return;

    console.log(`[game] player ${userId} disconnected from game ${session.gameId}`);

    session.markDisconnected(userId, (disconnectedUserId) => {
      this.handleAbandon(disconnectedUserId, session);
    });

    const opponentId =
      userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;

    const payload: PlayerDisconnectedPayload = {
      playerId: userId,
      remainingSeconds: DISCONNECT_TIMEOUT_SECONDS,
    };
    sendToUser(opponentId, WsEventType.PLAYER_DISCONNECTED, payload);
  }

  /**
   * Called by ConnectionManager when a player establishes a new WebSocket.
   *
   * If the player belongs to an active GameSession:
   *   - Cancels the pending disconnect timer.
   *   - Sends the current full game state to the reconnecting socket.
   *   - Notifies the opponent that the player is back.
   */
  handleReconnect(userId: string, socket: WebSocket): void {
    const session = gameSessionManager.getSessionByUser(userId);
    if (!session || session.status !== 'active') return;

    const wasDisconnected = session.isDisconnected(userId);

    // Cancel timer regardless — even a "fresh" connection (e.g. after server restart)
    // should have its timer cleared.
    session.cancelDisconnectTimer(userId);

    // Send full game state so the client can restore board, history, and color
    const fullState = session.getFullState(userId);
    if (fullState) {
      sendToSocket(socket, WsEventType.GAME_STATE_UPDATE, fullState);
      console.log(`[game] sent game state restore to player ${userId} in game ${session.gameId}`);
    }

    // Only notify opponent if they were actually disconnected (not first-time connect)
    if (wasDisconnected) {
      const opponentId =
        userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;

      const payload: PlayerReconnectedPayload = { playerId: userId };
      sendToUser(opponentId, WsEventType.PLAYER_RECONNECTED, payload);

      console.log(`[game] player ${userId} reconnected to game ${session.gameId}`);
    }
  }

  // ─── Abandonment ───────────────────────────────────────────────────────────

  /**
   * Ends a game by abandonment when a disconnect timer expires.
   * Persists the result, updates stats, broadcasts GAME_OVER, removes session.
   */
  private handleAbandon(abandonedUserId: string, session: GameSession): void {
    if (session.status !== 'active') {
      // Game already ended through other means while timer was running
      return;
    }

    // Cancel ALL remaining disconnect timers immediately — including any timer
    // for the opponent that may also be pending. Without this, if both players
    // have timers (e.g. post-restore stale session), the second timer would fire
    // after this one and overwrite the result, making the true winner appear to lose.
    session.cancelAllDisconnectTimers();

    const winnerId =
      abandonedUserId === session.whitePlayerId
        ? session.blackPlayerId
        : session.whitePlayerId;

    const gameResult: 'WHITE_WIN' | 'BLACK_WIN' =
      winnerId === session.whitePlayerId ? 'WHITE_WIN' : 'BLACK_WIN';

    console.log(
      `[game] game ${session.gameId} ended by abandonment — ${abandonedUserId} did not reconnect`,
    );

    const gameOverPayload: GameOverPayload = {
      gameId: session.gameId,
      result: gameResult,
      reason: 'ABANDONMENT',
      winner: winnerId,
      finalFen: session.getInitialFen(),
    };

    // Notify both players — the connected opponent gets GAME_OVER
    broadcastToGame(session, WsEventType.GAME_OVER, gameOverPayload);

    // Persist
    persistenceService
      .finishGame(
        session.gameId,
        session.whitePlayerId,
        session.blackPlayerId,
        toPrismaResult(gameResult),
        winnerId,
        gameOverPayload.finalFen,
      )
      .catch((err) => {
        console.error(
          `[game] failed to persist abandonment for game ${session.gameId}:`,
          err,
        );
      });

    // Remove the session
    gameSessionManager.removeSession(session.gameId);
  }


  // ─── Server Restart Recovery ────────────────────────────────────────────────

  /**
   * Restores all ACTIVE games from the database on server startup.
   *
   * For each active game:
   *   1. Loads moves ordered by creation time.
   *   2. Reconstructs a GameSession from the stored FEN (no move replay).
   *   3. Registers the session in GameSessionManager.
   *
   * After this completes, players can reconnect and receive GAME_STATE_UPDATE
   * as if the server never restarted.
   */
  async restoreActiveGames(): Promise<void> {
    const activeGames = await gameRepository.findActiveGames();

    if (activeGames.length === 0) {
      console.log('[game] no active games to restore');
      return;
    }

    console.log(`[game] restoring ${activeGames.length} active game(s)...`);

    let restored = 0;

    for (const game of activeGames) {
      try {
        const dbMoves = await moveRepository.findMovesByGameId(game.id);

        const moveHistory: MoveRecord[] = dbMoves.map((m) => ({
          moveNumber: m.moveNumber,
          from: m.from,
          to: m.to,
          san: m.san,
          fen: m.fenAfterMove,
        }));

        const restoreData: RestoreData = {
          gameId: game.id,
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId,
          currentFen: game.currentFen,
          moveHistory,
          createdAt: game.createdAt,
        };

        const session = GameSession.restore(restoreData);
        gameSessionManager.registerSession(session);
        restored++;
      } catch (err) {
        console.error(`[game] failed to restore game ${game.id}:`, err);
        // Continue restoring other games — one failure must not block the rest
      }
    }

    console.log(`[game] restored ${restored}/${activeGames.length} active game(s)`);

    // For restored sessions, start disconnect timers for players who are not
    // currently connected. This handles stale sessions from previous server runs:
    // if neither player reconnects within 60 seconds, the game is abandoned.
    //
    // We schedule this AFTER the listen callback so that players who connect
    // immediately (within the same event loop tick as startup) are not penalised.
    setImmediate(() => {
      this.startTimersForDisconnectedPlayers();
    });
  }

  /**
   * For every restored GameSession, starts a disconnect timer for each player
   * who is not currently connected via WebSocket.
   *
   * Called once after server-startup recovery completes.
   */
  private startTimersForDisconnectedPlayers(): void {
    const sessions = gameSessionManager.getAllSessions();

    for (const session of sessions) {
      for (const userId of [session.whitePlayerId, session.blackPlayerId]) {
        if (!connectionManager.hasConnection(userId) && !session.isDisconnected(userId)) {
          console.log(
            `[game] starting post-restore abandon timer for unconnected player ${userId} in game ${session.gameId}`,
          );
          session.markDisconnected(userId, (disconnectedUserId) => {
            this.handleAbandon(disconnectedUserId, session);
          });

          // Notify the other player if they ARE connected
          const opponentId =
            userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;
          const payload: PlayerDisconnectedPayload = {
            playerId: userId,
            remainingSeconds: DISCONNECT_TIMEOUT_SECONDS,
          };
          sendToUser(opponentId, WsEventType.PLAYER_DISCONNECTED, payload);
        }
      }
    }
  }


  removeFinishedGame(gameId: string): void {
    gameSessionManager.removeSession(gameId);
  }
}

export const gameManager = new GameManager();
