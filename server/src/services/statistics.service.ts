import { userRepository } from '../repositories/user.repository';

// ─── Statistics Service ───────────────────────────────────────────────────────

/**
 * Updates User statistics after a game completes.
 * Called only after the Game row has been successfully transitioned to FINISHED.
 * Only handles WHITE_WIN | BLACK_WIN | DRAW; ABORTED games do not affect stats.
 */
export const statisticsService = {
  async updateStats(
    whitePlayerId: string,
    blackPlayerId: string,
    result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW',
  ): Promise<void> {
    if (result === 'WHITE_WIN') {
      await Promise.all([
        userRepository.incrementStats(whitePlayerId, { wins: 1, gamesPlayed: 1 }),
        userRepository.incrementStats(blackPlayerId, { losses: 1, gamesPlayed: 1 }),
      ]);
      return;
    }

    if (result === 'BLACK_WIN') {
      await Promise.all([
        userRepository.incrementStats(whitePlayerId, { losses: 1, gamesPlayed: 1 }),
        userRepository.incrementStats(blackPlayerId, { wins: 1, gamesPlayed: 1 }),
      ]);
      return;
    }

    // DRAW
    await Promise.all([
      userRepository.incrementStats(whitePlayerId, { draws: 1, gamesPlayed: 1 }),
      userRepository.incrementStats(blackPlayerId, { draws: 1, gamesPlayed: 1 }),
    ]);
  },
};
