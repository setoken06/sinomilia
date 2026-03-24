"use client";

interface Props {
  hand: number[];
  onSelect: (card: number) => void;
  selectable?: boolean;
}

export default function PlayerHand({ hand, onSelect, selectable }: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap">
      {hand.sort((a, b) => a - b).map((card) => (
        <button
          key={card}
          onClick={() => selectable && onSelect(card)}
          disabled={!selectable}
          className={`
            w-12 h-16 rounded-lg border-2 flex items-center justify-center
            text-xl font-bold transition-all
            ${
              selectable
                ? "border-gray-400 hover:border-[#4a90d9] hover:scale-110 hover:bg-[#16213e] cursor-pointer active:scale-95"
                : "border-gray-600 text-gray-500 cursor-default"
            }
          `}
        >
          {card}
        </button>
      ))}
    </div>
  );
}
