"use client";

interface Props {
  chips: number;
  hasChanged: boolean;
  centerChipCount: number;
  onPlaceChip: () => void;
  onChange: () => void;
  onPass: () => void;
}

export default function ActionPanel({
  chips,
  hasChanged,
  centerChipCount,
  onPlaceChip,
  onChange,
  onPass,
}: Props) {
  const canPlaceChip = chips > 0 && centerChipCount < 9;
  const canChange = chips > 0 && !hasChanged;

  return (
    <div className="flex gap-2 justify-center">
      <button
        onClick={onPlaceChip}
        disabled={!canPlaceChip}
        className="flex-1 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-30"
        style={{ backgroundColor: "#ff8c00", color: "white" }}
      >
        チップを置く
      </button>
      <button
        onClick={onChange}
        disabled={!canChange}
        className="flex-1 py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-30"
        style={{ backgroundColor: "var(--accent-blue)", color: "white" }}
      >
        チェンジ
      </button>
      <button
        onClick={onPass}
        className="flex-1 py-3 rounded-lg font-bold text-sm bg-gray-700 text-gray-300 transition-colors hover:bg-gray-600"
      >
        パス
      </button>
    </div>
  );
}
