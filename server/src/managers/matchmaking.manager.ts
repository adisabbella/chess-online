import { GameSession } from '../sessions/game.session';
import { gameSessionManager } from './gameSession.manager';
import { gameManager } from './game.manager';

interface JoinResult {
  matched: true;
  session: GameSession;
}

interface WaitingResult {
  matched: false;
  position: number;
}

type QueueResult = JoinResult | WaitingResult;

class MatchmakingManager {
  private queue: string[] = [];

  joinQueue(userId: string): QueueResult {
    if (gameSessionManager.hasActiveGame(userId)) {
      throw new Error('User already has an active game');
    }

    if (this.queue.includes(userId)) {
      const position = this.queue.indexOf(userId) + 1;
      return { matched: false, position };
    }

    this.queue.push(userId);
    console.log(`[matchmaking] user ${userId} joined queue (size: ${this.queue.length})`);

    if (this.queue.length >= 2) {
      const playerAId = this.queue.shift()!;
      const playerBId = this.queue.shift()!;

      const session = gameManager.createGame(playerAId, playerBId);
      console.log(`[matchmaking] matched ${playerAId} vs ${playerBId}`);

      return { matched: true, session };
    }

    return { matched: false, position: this.queue.length };
  }

  leaveQueue(userId: string): void {
    const index = this.queue.indexOf(userId);
    if (index === -1) return;

    this.queue.splice(index, 1);
    console.log(`[matchmaking] user ${userId} left queue (size: ${this.queue.length})`);
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export const matchmakingManager = new MatchmakingManager();
