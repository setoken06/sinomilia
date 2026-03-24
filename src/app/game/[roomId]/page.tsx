"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { ClientGameState, RoundResult } from "@/game/types";
import GameBoard from "@/components/GameBoard";
import RoundResultView from "@/components/RoundResult";
import GameResult from "@/components/GameResult";

export default function GamePage() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const onGameStart = ({ state }: { state: ClientGameState }) => {
      setGameState(state);
    };

    const onStateUpdate = ({ state }: { state: ClientGameState }) => {
      setGameState(state);
    };

    const onRoundEnd = ({
      result,
      state,
    }: {
      result: RoundResult;
      state: ClientGameState;
    }) => {
      setRoundResult(result);
      setShowResult(true);
      // After animation, update to next state
      setTimeout(() => {
        setShowResult(false);
        setRoundResult(null);
        setGameState(state);
      }, 4000);
    };

    const onGameOver = ({
      state,
    }: {
      winnerId: string;
      state: ClientGameState;
      finalChips: { [playerId: string]: number };
    }) => {
      setGameState(state);
    };

    const onDisconnect = () => {
      setDisconnected(true);
    };

    socket.on("game_start", onGameStart);
    socket.on("state_update", onStateUpdate);
    socket.on("round_end", onRoundEnd);
    socket.on("game_over", onGameOver);
    socket.on("opponent_disconnected", onDisconnect);

    return () => {
      socket.off("game_start", onGameStart);
      socket.off("state_update", onStateUpdate);
      socket.off("round_end", onRoundEnd);
      socket.off("game_over", onGameOver);
      socket.off("opponent_disconnected", onDisconnect);
    };
  }, [socket]);

  const handleSelectCard = useCallback(
    (card: number) => {
      socket.emit("select_card", { card });
    },
    [socket]
  );

  const handleAction = useCallback(
    (action: Parameters<typeof socket.emit<"action">>[1]) => {
      socket.emit("action", action);
    },
    [socket]
  );

  if (disconnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl text-red-400">相手が切断しました</p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg font-bold"
            style={{ backgroundColor: "var(--accent-gold)", color: "#1a1a2e" }}
          >
            トップに戻る
          </a>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">接続中...</p>
      </div>
    );
  }

  if (showResult && roundResult) {
    return (
      <RoundResultView
        result={roundResult}
        yourId={gameState.you.id}
      />
    );
  }

  if (gameState.phase === "game_over") {
    return <GameResult state={gameState} />;
  }

  return (
    <GameBoard
      state={gameState}
      onSelectCard={handleSelectCard}
      onAction={handleAction}
    />
  );
}
