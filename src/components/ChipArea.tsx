"use client";

import type { ChipSide } from "@/game/types";

interface Props {
  chips: ChipSide[];
}

export default function ChipArea({ chips }: Props) {
  if (chips.length === 0) {
    return (
      <div className="text-center">
        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mx-auto">
          <span className="text-gray-600 text-sm">0</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">チップ置き場</p>
      </div>
    );
  }

  const sunCount = chips.filter((c) => c === "sun").length;
  const moonCount = chips.filter((c) => c === "moon").length;

  return (
    <div className="text-center space-y-3">
      <div className="text-5xl font-bold" style={{ color: "var(--accent-gold)" }}>
        {chips.length}
      </div>
      <div className="flex justify-center gap-1 flex-wrap max-w-[200px]">
        {chips.map((chip, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={
              chip === "sun"
                ? { backgroundColor: "#ff8c00", color: "white" }
                : { backgroundColor: "#4a4a8a", color: "#c0c0ff" }
            }
          >
            {chip === "sun" ? "☀" : "☾"}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-3 text-xs text-gray-400">
        {sunCount > 0 && <span>☀ {sunCount}</span>}
        {moonCount > 0 && <span>☾ {moonCount}</span>}
      </div>
    </div>
  );
}
