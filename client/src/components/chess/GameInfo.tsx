import React from 'react';
import { PlayerColor, GameOverPayload } from '@chess-online/shared';

interface GameInfoProps {
  turn: PlayerColor | null;
  playerColor: PlayerColor | null;
  isCheck: boolean;
  gameActive: boolean;
  gameOverData: GameOverPayload | null;
  drawOffer: { from: 'self' | 'opponent' } | null;
  moveRejectedReason: string | null;
  onResign: () => void;
  onOfferDraw: () => void;
  onRespondDraw: (accept: boolean) => void;
  onClearMoveRejected: () => void;
}

function getResultText(data: GameOverPayload, playerColor: PlayerColor | null): string {
  if (data.result === 'DRAW') return 'Draw';
  if (!playerColor) return data.result === 'WHITE_WIN' ? 'White wins' : 'Black wins';
  const playerWon =
    (data.result === 'WHITE_WIN' && playerColor === 'white') ||
    (data.result === 'BLACK_WIN' && playerColor === 'black');
  return playerWon ? 'You win!' : 'You lose';
}

function getReasonText(reason: string): string {
  const reasons: Record<string, string> = {
    CHECKMATE: 'Checkmate',
    STALEMATE: 'Stalemate',
    RESIGN: 'Resignation',
    DRAW_AGREEMENT: 'Draw by agreement',
    INSUFFICIENT_MATERIAL: 'Insufficient material',
    THREEFOLD_REPETITION: 'Threefold repetition',
    FIFTY_MOVE_RULE: 'Fifty-move rule',
  };
  return reasons[reason] ?? reason;
}

function GameInfo({
  turn,
  playerColor,
  isCheck,
  gameActive,
  gameOverData,
  drawOffer,
  moveRejectedReason,
  onResign,
  onOfferDraw,
  onRespondDraw,
  onClearMoveRejected,
}: GameInfoProps): React.JSX.Element {
  const isMyTurn = turn === playerColor;

  return (
    <div className="flex flex-col gap-3">
      {/* Turn indicator */}
      {gameActive && (
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isMyTurn ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
          <span className="text-sm font-medium text-gray-300">
            {isMyTurn ? 'Your turn' : "Opponent's turn"}
          </span>
          {isCheck && (
            <span className="text-xs font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded-full border border-red-800">
              CHECK
            </span>
          )}
        </div>
      )}

      {/* Move rejected message */}
      {moveRejectedReason && (
        <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
          <span className="text-red-400 text-sm">{moveRejectedReason}</span>
          <button
            onClick={onClearMoveRejected}
            className="text-red-600 hover:text-red-400 text-xs ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* Game over display */}
      {gameOverData && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white mb-1">
            {getResultText(gameOverData, playerColor)}
          </p>
          <p className="text-sm text-gray-400">
            {getReasonText(gameOverData.reason)}
          </p>
        </div>
      )}

      {/* Draw offer received */}
      {drawOffer?.from === 'opponent' && gameActive && (
        <div className="bg-gray-800 border border-indigo-700 rounded-lg p-3">
          <p className="text-sm text-gray-300 mb-2">Opponent offers a draw</p>
          <div className="flex gap-2">
            <button
              id="btn-accept-draw"
              onClick={() => onRespondDraw(true)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              id="btn-decline-draw"
              onClick={() => onRespondDraw(false)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold hover:bg-gray-600 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Draw offer sent */}
      {drawOffer?.from === 'self' && gameActive && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <p className="text-sm text-gray-400 italic">Draw offer sent…</p>
        </div>
      )}

      {/* Action buttons */}
      {gameActive && (
        <div className="flex gap-2">
          <button
            id="btn-resign"
            onClick={onResign}
            className="flex-1 px-4 py-2 rounded-lg border border-red-800 text-red-400 text-sm font-semibold hover:bg-red-950 transition-colors"
          >
            Resign
          </button>
          <button
            id="btn-offer-draw"
            onClick={onOfferDraw}
            disabled={drawOffer !== null}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Offer Draw
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(GameInfo);
