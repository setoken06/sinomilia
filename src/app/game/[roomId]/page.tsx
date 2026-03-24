"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { getSession, clearSession } from "@/lib/socket";
import type { ClientGameState, RoundResult, PlayerAction } from "@/game/types";
import GameBoard from "@/components/GameBoard";
import RoundResultView from "@/components/RoundResult";
import GameResult from "@/components/GameResult";

export default function GamePage() {
  const socket = useSocket();
  const params = useParams();
  const roomId = params.roomId as string;
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [opponentAway, setOpponentAway] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = () => {
      const session = getSession();
      if (session && session.roomId === roomId) {
        // Rejoin with saved identity
        socket.emit("rejoin_room" as any, {
          roomId: session.roomId,
          playerId: session.playerId,
        });
      } else {
        // Request current state (for initial navigation from lobby)
        socket.emit("get_state" as any);
      }
    };

    if (socket.connected) {
      init();
    } else {
      socket.once("connect", init);
    }
  }, [socket, roomId]);

  useEffect(() => {
    const onStateUpdate = ({ state }: { state: ClientGameState }) => {
      setGameState(state);
      setOpponentAway(state.opponent.isDisconnected);
    };

    const onGameStart = ({ state }: { state: ClientGameState }) => {
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
      clearSession();
    };

    const onOpponentDisconnected = () => {
      setOpponentAway(true);
    };

    const onOpponentReconnected = () => {
      setOpponentAway(false);
    };

    socket.on("game_start", onGameStart);
    socket.on("state_update", onStateUpdate);
    socket.on("round_end", onRoundEnd);
    socket.on("game_over", onGameOver);
    socket.on("opponent_disconnected", onOpponentDisconnected);
    socket.on("opponent_reconnected", onOpponentReconnected);

    return () => {
      socket.off("game_start", onGameStart);
      socket.off("state_update", onStateUpdate);
      socket.off("round_end", onRoundEnd);
      socket.off("game_over", onGameOver);
      socket.off("opponent_disconnected", onOpponentDisconnected);
      socket.off("opponent_reconnected", onOpponentReconnected);
    };
  }, [socket]);

  const handleSelectCard = useCallback(
    (card: number) => {
      socket.emit("select_card", { card });
    },
    [socket]
  );

  const handleAction = useCallback(
    (action: PlayerAction) => {
      socket.emit("action", action);
    },
    [socket]
  );

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">接続中...</p>
      </div>
    );
  }

  if (showResult && roundResult) {
    return (
      <RoundResultView result={roundResult} yourId={gameState.you.id} />
    );
  }

  if (gameState.phase === "game_over") {
    return <GameResult state={gameState} />;
  }

  return (
    <>
      {opponentAway && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600/90 text-center py-2 text-sm font-bold z-50">
          相手が離席中...
        </div>
      )}
      <GameBoard
        state={gameState}
        onSelectCard={handleSelectCard}
        onAction={handleAction}
      />
    </>
  );
}
