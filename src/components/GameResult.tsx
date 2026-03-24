"use client";

import type { ClientGameState } from "@/game/types";

interface Props {
  state: ClientGameState;
}

export default function GameResult({ state }: Props) {
  const isWinner = state.winner === state.you.id;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div
          className="text-5xl font-bold"
          style={{ color: isWinner ? "var(--accent-gold)" : "#ff4444" }}
        >
          {isWinner ? "勝利！" : "敗北..."}
        </div>

        <div className="space-y-3">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-gray-400">{state.you.name}</p>
              <p className="text-3xl font-bold text-white">{state.you.chips}</p>
              <p className="text-xs text-gray-500">チップ</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">{state.opponent.name}</p>
              <p className="text-3xl font-bold text-white">
                {state.opponent.chips}
              </p>
              <p className="text-xs text-gray-500">チップ</p>
            </div>
          </div>
        </div>

        <a
          href="/"
          className="inline-block px-8 py-3 rounded-lg font-bold text-lg transition-colors"
          style={{ backgroundColor: "var(--accent-gold)", color: "#1a1a2e" }}
        >
          トップに戻る
        </a>
      </div>
    </div>
  );
}
