"use client";

import { useState, useEffect } from "react";
import type { RoundResult } from "@/game/types";

interface Props {
  result: RoundResult;
  yourId: string;
}

export default function RoundResultView({ result, yourId }: Props) {
  const [phase, setPhase] = useState<"first" | "second" | "result">("first");

  const opponentId = Object.keys(result.cards).find((id) => id !== yourId)!;
  const firstRevealerId = result.revealOrder[0];
  const secondRevealerId = result.revealOrder[1];

  const firstCard = result.cards[firstRevealerId];
  const secondCard = result.cards[secondRevealerId];
  const firstDistance = result.distances[firstRevealerId];
  const secondDistance = result.distances[secondRevealerId];

  const firstIsYou = firstRevealerId === yourId;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("second"), 1000);
    const t2 = setTimeout(() => setPhase("result"), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isWinner = result.winnerId === yourId;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8">
      <div className="text-sm text-gray-400">中央チップ合計: {result.totalChips}</div>

      <div className="flex items-center gap-8">
        {/* First reveal */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 mb-1">
            {firstIsYou ? "あなた" : "相手"}
          </p>
          <div className="w-20 h-28 rounded-xl border-2 border-white bg-[#16213e] flex items-center justify-center text-3xl font-bold">
            {firstCard}
          </div>
          <p className="text-xs text-gray-400">差: {firstDistance}</p>
        </div>

        <div className="text-gray-500 text-2xl">VS</div>

        {/* Second reveal */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 mb-1">
            {firstIsYou ? "相手" : "あなた"}
          </p>
          <div
            className={`w-20 h-28 rounded-xl border-2 flex items-center justify-center text-3xl font-bold transition-all duration-500 ${
              phase !== "first"
                ? "border-white bg-[#16213e]"
                : "border-gray-600 bg-gray-800 text-gray-800"
            }`}
          >
            {phase === "first" ? "?" : secondCard}
          </div>
          <p className={`text-xs ${phase === "first" ? "text-transparent" : "text-gray-400"}`}>
            差: {secondDistance}
          </p>
        </div>
      </div>

      {phase === "result" && (
        <div className="text-center space-y-2">
          <div
            className="text-3xl font-bold"
            style={{ color: isWinner ? "var(--accent-gold)" : "#ff4444" }}
          >
            {isWinner ? "勝利！" : "敗北..."}
          </div>
          <div className="text-sm text-gray-300">
            獲得チップ: {result.chipsWon}枚
            {result.moonBonus > 0 && (
              <span className="text-purple-400"> (月ボーナス: +{result.moonBonus})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
