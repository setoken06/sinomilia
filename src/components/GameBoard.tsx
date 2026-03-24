"use client";

import { useState } from "react";
import type { ClientGameState, PlayerAction, ChipSide } from "@/game/types";
import PlayerHand from "./PlayerHand";
import ChipArea from "./ChipArea";
import ActionPanel from "./ActionPanel";

interface Props {
  state: ClientGameState;
  onSelectCard: (card: number) => void;
  onAction: (action: PlayerAction) => void;
}

export default function GameBoard({ state, onSelectCard, onAction }: Props) {
  const [showChipModal, setShowChipModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);

  const isCardSelect = state.phase === "card_select";
  const isAction = state.phase === "action";

  const handlePlaceChip = (side: ChipSide) => {
    onAction({ type: "place_chip", side });
    setShowChipModal(false);
  };

  const handleChangeCard = (card: number) => {
    onAction({ type: "change_card", newCard: card });
    setShowChangeModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-3 max-w-lg mx-auto select-none">
      {/* Header */}
      <div className="text-center py-2">
        <span className="text-xs text-gray-500">ラウンド {state.roundNumber}</span>
        {isCardSelect && !state.you.selectedCard && (
          <p className="text-sm mt-1" style={{ color: "var(--accent-gold)" }}>
            カードを選んでください
          </p>
        )}
        {isCardSelect && state.you.selectedCard && !state.opponent.hasSelectedCard && (
          <p className="text-sm text-gray-400 mt-1">相手のカード選択を待っています...</p>
        )}
        {isAction && state.isYourTurn && (
          <p className="text-sm mt-1" style={{ color: "var(--accent-gold)" }}>
            あなたのターン
          </p>
        )}
        {isAction && !state.isYourTurn && (
          <p className="text-sm text-gray-400 mt-1">相手のターン...</p>
        )}
      </div>

      {/* Opponent Area */}
      <div className="px-2 py-3 rounded-lg bg-[#16213e]/50 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-300">{state.opponent.name}</p>
            <p className="text-xs text-gray-500">手札: {state.opponent.handCount}枚</p>
          </div>
          <div className="flex items-center gap-3">
            {state.opponent.hasSelectedCard && (
              <div className="w-10 h-14 rounded border-2 border-gray-500 bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                ?
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>
                {state.opponent.chips}
              </div>
              <div className="text-[10px] text-gray-500">チップ</div>
            </div>
          </div>
        </div>
        {state.opponent.usedCards.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 mr-1">使用済:</span>
            {state.opponent.usedCards.sort((a, b) => a - b).map((c, i) => (
              <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Center Chip Area */}
      <div className="flex-1 flex items-center justify-center">
        <ChipArea chips={state.round.centerChips} />
      </div>

      {/* Your Area */}
      <div className="space-y-3 pb-4">
        {/* Your info */}
        <div className="space-y-1 px-2">
        {state.you.usedCards.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 mr-1">使用済:</span>
            {state.you.usedCards.sort((a, b) => a - b).map((c, i) => (
              <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        )}
        </div>
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-sm font-bold text-white">{state.you.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {state.you.selectedCard && (
              <div className="w-10 h-14 rounded border-2 flex items-center justify-center text-lg font-bold"
                style={{ borderColor: "var(--accent-blue)", color: "var(--accent-blue)" }}>
                {state.you.selectedCard}
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>
                {state.you.chips}
              </div>
              <div className="text-[10px] text-gray-500">チップ</div>
            </div>
          </div>
        </div>

        {/* Hand */}
        {isCardSelect && !state.you.selectedCard && (
          <PlayerHand
            hand={state.you.hand}
            onSelect={onSelectCard}
            selectable
          />
        )}

        {/* Actions */}
        {isAction && state.isYourTurn && (
          <ActionPanel
            chips={state.you.chips}
            hasChanged={state.you.hasChangedThisRound}
            centerChipCount={state.round.centerChips.length}
            onPlaceChip={() => setShowChipModal(true)}
            onChange={() => setShowChangeModal(true)}
            onPass={() => onAction({ type: "pass" })}
          />
        )}
      </div>

      {/* Chip Side Modal */}
      {showChipModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowChipModal(false)}>
          <div className="bg-[#16213e] p-6 rounded-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-center font-bold">チップの面を選択</p>
            <div className="flex gap-4">
              <button
                onClick={() => handlePlaceChip("sun")}
                className="w-24 h-24 rounded-xl text-4xl font-bold flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105"
                style={{ backgroundColor: "#ff8c00", color: "white" }}
              >
                <span>☀</span>
                <span className="text-xs">太陽</span>
              </button>
              <button
                onClick={() => handlePlaceChip("moon")}
                className="w-24 h-24 rounded-xl text-4xl font-bold flex flex-col items-center justify-center gap-1 transition-transform hover:scale-105"
                style={{ backgroundColor: "#4a4a8a", color: "#c0c0ff" }}
              >
                <span>☾</span>
                <span className="text-xs">月</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Change Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowChangeModal(false)}>
          <div className="bg-[#16213e] p-6 rounded-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-center font-bold">変更するカードを選択</p>
            <p className="text-xs text-gray-400 text-center">チップ1枚を相手に渡します</p>
            <PlayerHand
              hand={state.you.hand.filter((c) => c !== state.you.selectedCard)}
              onSelect={handleChangeCard}
              selectable
            />
          </div>
        </div>
      )}
    </div>
  );
}
