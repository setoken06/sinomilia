"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { getSession, clearSession } from "@/lib/socket";
import type { ClientGameState, RoundResult, PlayerAction } from "@/game/types";
import GameBoard from "@/components/GameBoard";
import RoundResultView from "@/components/RoundResult";
import GameResult from "@/components/GameResult";

type PageState = "loading" | "confirm_rejoin" | "playing" | "no_room";

export default function GamePage() {
  const socket = useSocket();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const [pageState, setPageState] = useState<PageState>("loading");
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [opponentAway, setOpponentAway] = useState(false);
  const initialized = useRef(false);

  // On mount, check if we have a session or came from lobby
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const session = getSession();

    if (session && session.roomId === roomId) {
      // Have a session for this room - show confirmation
      setPageState("confirm_rejoin");
    } else {
      // Came from lobby - request current state
      const tryGetState = () => {
        socket.emit("get_state" as any);

        // If no response within 2 seconds, room doesn't exist
        const timeout = setTimeout(() => {
          if (!gameState) {
            setPageState("no_room");
          }
        }, 2000);

        const onState = ({ state }: { state: ClientGameState }) => {
          clearTimeout(timeout);
          setGameState(state);
          setPageState("playing");
        };
        socket.once("state_update", onState);

        return () => {
          clearTimeout(timeout);
          socket.off("state_update", onState);
        };
      };

      if (socket.connected) {
        tryGetState();
      } else {
        socket.once("connect", tryGetState);
      }
    }
  }, [socket, roomId]);

  const handleRejoin = useCallback(() => {
    const session = getSession();
    if (!session) {
      setPageState("no_room");
      return;
    }

    setPageState("loading");

    const onState = ({ state }: { state: ClientGameState }) => {
      clearTimeout(timeout);
      setGameState(state);
      setPageState("playing");
      setOpponentAway(state.opponent.isDisconnected);
    };

    const onError = () => {
      clearTimeout(timeout);
      socket.off("state_update", onState);
      clearSession();
      setPageState("no_room");
    };

    const timeout = setTimeout(() => {
      socket.off("state_update", onState);
      socket.off("error", onError);
      clearSession();
      setPageState("no_room");
    }, 3000);

    socket.once("state_update", onState);
    socket.once("error", onError);

    const doRejoin = () => {
      socket.emit("rejoin_room" as any, {
        roomId: session.roomId,
        playerId: session.playerId,
      });
    };

    if (socket.connected) {
      doRejoin();
    } else {
      socket.once("connect", doRejoin);
    }
  }, [socket]);

  const handleDeclineRejoin = useCallback(() => {
    clearSession();
    router.push("/");
  }, [router]);

  // Game event listeners
  useEffect(() => {
    const onStateUpdate = ({ state }: { state: ClientGameState }) => {
      setGameState(state);
      setPageState("playing");
      setOpponentAway(state.opponent.isDisconnected);
    };

    const onGameStart = ({ state }: { state: ClientGameState }) => {
      setGameState(state);
      setPageState("playing");
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

  // --- Render ---

  if (pageState === "confirm_rejoin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <p className="text-xl text-gray-300">進行中のゲームがあります</p>
          <p className="text-sm text-gray-500">ルーム: {roomId}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRejoin}
              className="px-6 py-3 rounded-lg font-bold text-lg"
              style={{ backgroundColor: "var(--accent-gold)", color: "#1a1a2e" }}
            >
              復帰する
            </button>
            <button
              onClick={handleDeclineRejoin}
              className="px-6 py-3 rounded-lg font-bold text-lg bg-gray-700 text-gray-300"
            >
              トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "no_room") {
    clearSession();
    router.push("/");
    return null;
  }

  if (pageState === "loading" || !gameState) {
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
