import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../store/game.store';
import { useGameActions } from '../hooks/useGameActions';
import { useWebSocket } from '../hooks/useWebSocket';
import { socketService } from '../services/socket';
import ChessBoard from '../components/chess/ChessBoard';
import MoveHistory from '../components/chess/MoveHistory';
import GameInfo from '../components/chess/GameInfo';
import PromotionDialog from '../components/chess/PromotionDialog';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function Game(): React.JSX.Element {
  const { gameId: routeGameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { status } = useWebSocket();

  const {
    gameId,
    color,
    fen,
    moveHistory,
    turn,
    gameStatus,
    isCheck,
    lastMove,
    gameOverData,
    drawOffer,
    moveRejectedReason,
    clearMoveRejected,
  } = useGame();

  const { makeMove, resign, offerDraw, respondDraw } = useGameActions();

  // Promotion state
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Ensure socket is connected
  useEffect(() => {
    socketService.connect();
  }, []);

  // Handle promotion
  const handlePromotion = useCallback(
    (from: string, to: string) => {
      setPromotionPending({ from, to });
    },
    [],
  );

  const handlePromotionSelect = useCallback(
    (piece: string) => {
      if (!promotionPending) return;
      makeMove(promotionPending.from, promotionPending.to, piece);
      setPromotionPending(null);
    },
    [promotionPending, makeMove],
  );

  const handlePromotionCancel = useCallback(() => {
    setPromotionPending(null);
  }, []);

  const handleMove = useCallback(
    (from: string, to: string) => {
      makeMove(from, to);
    },
    [makeMove],
  );

  // If no game data, show error state
  if (!gameId || gameId !== routeGameId || !color) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="text-6xl select-none">♟</div>
          <h1 className="text-2xl font-bold">No Active Game</h1>
          <p className="text-gray-400">This game session is not available.</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentFen = fen ?? INITIAL_FEN;
  const gameActive = gameStatus === 'active';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Promotion dialog */}
      {promotionPending && (
        <PromotionDialog
          playerColor={color}
          onSelect={handlePromotionSelect}
          onCancel={handlePromotionCancel}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold tracking-tight">
            ♟ Chess Online
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500">
              Playing as{' '}
              <span className={color === 'white' ? 'text-gray-200' : 'text-gray-400'}>
                {color}
              </span>
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-green-400' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Chess board */}
          <div className="w-full lg:flex-shrink-0 lg:w-[520px]">
            <ChessBoard
              fen={currentFen}
              playerColor={color}
              turn={turn}
              isCheck={isCheck}
              lastMove={lastMove}
              gameActive={gameActive}
              onMove={handleMove}
              onPromotion={handlePromotion}
            />
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-72 flex flex-col gap-4">
            {/* Game info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <GameInfo
                turn={turn}
                playerColor={color}
                isCheck={isCheck}
                gameActive={gameActive}
                gameOverData={gameOverData}
                drawOffer={drawOffer}
                moveRejectedReason={moveRejectedReason}
                onResign={resign}
                onOfferDraw={offerDraw}
                onRespondDraw={respondDraw}
                onClearMoveRejected={clearMoveRejected}
              />
            </div>

            {/* Move history */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden h-64 lg:h-80">
              <MoveHistory moves={moveHistory} />
            </div>

            {/* Back to home when game is over */}
            {!gameActive && (
              <button
                id="btn-back-home"
                onClick={() => navigate('/')}
                className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
