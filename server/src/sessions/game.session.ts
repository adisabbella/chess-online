import { PlayerColor } from '@chess-online/shared';

export type GameStatus = 'active';

export interface GameSession {
  gameId: string;
  whitePlayerId: string;
  blackPlayerId: string;
  status: GameStatus;
  createdAt: Date;
}

export function getPlayerColor(session: GameSession, userId: string): PlayerColor | null {
  if (session.whitePlayerId === userId) return 'white';
  if (session.blackPlayerId === userId) return 'black';
  return null;
}
