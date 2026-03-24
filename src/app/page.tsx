"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { saveSession, getSession } from "@/lib/socket";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const socket = useSocket();

  // Check for existing session to rejoin
  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push(`/game/${session.roomId}`);
    }
  }, [router]);

  useEffect(() => {
    const onPlayerId = ({ playerId }: { playerId: string }) => {
      // Save will be completed once we know the roomId in the handler
      (window as any).__sinomilia_playerId = playerId;
    };
    (socket as any).on("player_id", onPlayerId);
    return () => {
      (socket as any).off("player_id", onPlayerId);
    };
  }, [socket]);

  const handleCreate = () => {
    if (!playerName.trim()) return;
    setError("");
    socket.emit("create_room", { playerName: playerName.trim() });

    socket.once("room_created", ({ roomId }) => {
      setCreatedRoomId(roomId);
      setWaiting(true);

      // Wait a tick for player_id to arrive
      setTimeout(() => {
        const playerId = (window as any).__sinomilia_playerId;
        if (playerId) saveSession(roomId, playerId);
      }, 100);

      socket.once("game_start", () => {
        router.push(`/game/${roomId}`);
      });
    });
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    setError("");
    const targetRoom = roomId.trim().toUpperCase();
    socket.emit("join_room", {
      roomId: targetRoom,
      playerName: playerName.trim(),
    });

    socket.once("room_joined", ({ roomId: joinedRoomId }) => {
      setTimeout(() => {
        const playerId = (window as any).__sinomilia_playerId;
        if (playerId) saveSession(joinedRoomId, playerId);
      }, 100);

      socket.once("game_start", () => {
        router.push(`/game/${joinedRoomId}`);
      });
    });

    socket.once("error", ({ message }) => {
      setError(message);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-wider mb-2" style={{ color: "var(--accent-gold)" }}>
            シノミリア
          </h1>
          <p className="text-gray-400 text-sm">2人対戦カードゲーム</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="プレイヤー名"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#16213e] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#4a90d9]"
            maxLength={12}
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {!waiting ? (
            <>
              <button
                onClick={handleCreate}
                disabled={!playerName.trim()}
                className="w-full py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-40"
                style={{ backgroundColor: "var(--accent-gold)", color: "#1a1a2e" }}
              >
                ルームを作成
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-600" />
                <span className="text-gray-500 text-sm">または</span>
                <div className="flex-1 h-px bg-gray-600" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ルームID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#16213e] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#4a90d9] tracking-widest text-center text-lg"
                  maxLength={4}
                />
                <button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || !roomId.trim()}
                  className="px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent-blue)", color: "white" }}
                >
                  参加
                </button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-300">相手の参加を待っています...</p>
              <div className="text-4xl font-mono tracking-[0.5em] font-bold" style={{ color: "var(--accent-gold)" }}>
                {createdRoomId}
              </div>
              <p className="text-gray-500 text-sm">このIDを相手に伝えてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
