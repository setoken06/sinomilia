"use client";

import type { PlacedChip } from "@/game/types";

interface Props {
  chips: PlacedChip[];
  yourId: string;
  opponentName: string;
  yourName: string;
}

export default function ChipArea({ chips, yourId, yourName, opponentName }: Props) {
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

  const yourChips = chips.filter((c) => c.playerId === yourId);
  const opponentChips = chips.filter((c) => c.playerId !== yourId);

  return (
    <div className="text-center space-y-3">
      <div className="text-5xl font-bold" style={{ color: "var(--accent-gold)" }}>
        {chips.length}
      </div>

      <div className="space-y-2">
        {/* Opponent's chips */}
        {opponentChips.length > 0 && (
          <ChipGroup name={opponentName} chips={opponentChips} />
        )}
        {/* Your chips */}
        {yourChips.length > 0 && (
          <ChipGroup name={yourName} chips={yourChips} />
        )}
      </div>
    </div>
  );
}

function ChipGroup({ name, chips }: { name: string; chips: PlacedChip[] }) {
  const sunCount = chips.filter((c) => c.side === "sun").length;
  const moonCount = chips.filter((c) => c.side === "moon").length;

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 text-right shrink-0">{name}</span>
      <div className="flex gap-1">
        {chips.map((chip, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={
              chip.side === "sun"
                ? { backgroundColor: "#ff8c00", color: "white" }
                : { backgroundColor: "#4a4a8a", color: "#c0c0ff" }
            }
          >
            {chip.side === "sun" ? "☀" : "☾"}
          </div>
        ))}
      </div>
      <span className="text-[10px] text-gray-500 w-12 shrink-0">
        {sunCount > 0 && `☀${sunCount}`} {moonCount > 0 && `☾${moonCount}`}
      </span>
    </div>
  );
}
