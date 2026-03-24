import {
  GameState,
  PlayerState,
  PlayerAction,
  RoundState,
  RoundResult,
  ChipSide,
} from "./types";

export const STARTING_CHIPS = 15;
export const MAX_CENTER_CHIPS = 9;
export const MIN_HAND_SIZE = 2;
export const VICTORY_BONUS = 2;

export function createPlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    hand: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    chips: STARTING_CHIPS,
    selectedCard: null,
    hasChangedThisRound: false,
    usedCards: [],
  };
}

export function initializeGame(
  roomId: string,
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string
): GameState {
  const startingPlayer = Math.random() < 0.5 ? player1Id : player2Id;
  return {
    roomId,
    players: [
      createPlayer(player1Id, player1Name),
      createPlayer(player2Id, player2Name),
    ],
    round: createRoundState(startingPlayer),
    roundNumber: 1,
    phase: "card_select",
    winner: null,
    lastRoundWinner: null,
  };
}

function createRoundState(startingPlayerId: string): RoundState {
  return {
    centerChips: [],
    startingPlayerId,
    currentTurnPlayerId: startingPlayerId,
    lastActionPlayerId: null,
    lastAction: null,
    consecutivePasses: 0,
    firstPassPlayerId: null,
    changeJustPerformed: false,
  };
}

export function getPlayer(state: GameState, playerId: string): PlayerState {
  return state.players.find((p) => p.id === playerId)!;
}

export function getOpponent(state: GameState, playerId: string): PlayerState {
  return state.players.find((p) => p.id !== playerId)!;
}

function getOtherPlayerId(state: GameState, playerId: string): string {
  return state.players.find((p) => p.id !== playerId)!.id;
}

export function selectCard(
  state: GameState,
  playerId: string,
  card: number
): GameState | string {
  if (state.phase !== "card_select") return "カード選択フェーズではありません";

  const player = getPlayer(state, playerId);
  if (!player.hand.includes(card)) return "そのカードは手札にありません";

  const newState = structuredClone(state);
  const p = getPlayer(newState, playerId);
  p.selectedCard = card;

  // Both players selected -> move to action phase
  if (newState.players.every((p) => p.selectedCard !== null)) {
    newState.phase = "action";
  }

  return newState;
}

export function validateAction(
  state: GameState,
  playerId: string,
  action: PlayerAction
): string | null {
  if (state.phase !== "action") return "アクションフェーズではありません";
  if (state.round.currentTurnPlayerId !== playerId) return "あなたのターンではありません";

  const player = getPlayer(state, playerId);

  switch (action.type) {
    case "place_chip":
      if (player.chips <= 0) return "チップがありません";
      if (state.round.centerChips.length >= MAX_CENTER_CHIPS)
        return "これ以上チップを置けません";
      break;
    case "change_card":
      if (player.hasChangedThisRound) return "このラウンドでは既にチェンジしています";
      if (player.chips <= 0) return "チップがありません";
      if (!player.hand.includes(action.newCard))
        return "そのカードは手札にありません";
      if (action.newCard === player.selectedCard)
        return "同じカードには変更できません";
      break;
    case "pass":
      break;
  }

  return null;
}

export function performAction(
  state: GameState,
  playerId: string,
  action: PlayerAction
): GameState | string {
  const error = validateAction(state, playerId, action);
  if (error) return error;

  const newState = structuredClone(state);
  const player = getPlayer(newState, playerId);
  const opponentId = getOtherPlayerId(newState, playerId);

  switch (action.type) {
    case "place_chip":
      player.chips -= 1;
      newState.round.centerChips.push(action.side);
      newState.round.consecutivePasses = 0;
      newState.round.lastActionPlayerId = playerId;
      newState.round.lastAction = action;
      newState.round.changeJustPerformed = false;
      break;

    case "change_card":
      player.chips -= 1;
      const opponent = getPlayer(newState, opponentId);
      opponent.chips += 1;
      player.selectedCard = action.newCard;
      player.hasChangedThisRound = true;
      newState.round.consecutivePasses = 0;
      newState.round.lastActionPlayerId = playerId;
      newState.round.lastAction = action;
      newState.round.changeJustPerformed = true;
      break;

    case "pass":
      newState.round.consecutivePasses += 1;
      if (newState.round.firstPassPlayerId === null) {
        newState.round.firstPassPlayerId = playerId;
      }
      // パスはアクションに含まれない — lastActionPlayerIdは更新しない
      newState.round.lastAction = action;
      break;
  }

  // Check round end conditions
  const roundEnded = checkRoundEnd(newState);

  if (roundEnded) {
    newState.phase = "reveal";
  } else {
    // Switch turn
    newState.round.currentTurnPlayerId = opponentId;
    if (action.type !== "pass") {
      newState.round.changeJustPerformed =
        action.type === "change_card";
    }
  }

  return newState;
}

function checkRoundEnd(state: GameState): boolean {
  // Condition 1: 9 chips placed
  if (state.round.centerChips.length >= MAX_CENTER_CHIPS) return true;

  // Condition 2: Both players passed consecutively
  if (state.round.consecutivePasses >= 2) return true;

  // Condition 3: Change was just performed and then pass
  if (
    state.round.changeJustPerformed &&
    state.round.lastAction?.type === "pass"
  )
    return true;

  return false;
}

export function resolveRound(state: GameState): RoundResult {
  const [p1, p2] = state.players;
  const totalChips = state.round.centerChips.length;

  const p1Card = p1.selectedCard!;
  const p2Card = p2.selectedCard!;
  const p1Distance = Math.abs(p1Card - totalChips);
  const p2Distance = Math.abs(p2Card - totalChips);

  let winnerId: string | null = null;
  let loserId: string | null = null;

  if (p1Distance < p2Distance) {
    winnerId = p1.id;
    loserId = p2.id;
  } else if (p2Distance < p1Distance) {
    winnerId = p2.id;
    loserId = p1.id;
  } else {
    // Tied distance
    if (totalChips === 0) {
      // No chips placed, first passer wins
      if (state.round.firstPassPlayerId) {
        winnerId = state.round.firstPassPlayerId;
        loserId = getOtherPlayerId(state, winnerId);
      }
    } else {
      // Last action player loses
      if (state.round.lastActionPlayerId) {
        loserId = state.round.lastActionPlayerId;
        winnerId = getOtherPlayerId(state, loserId);
      }
    }
  }

  // Calculate moon bonus
  let moonBonus = 0;
  if (winnerId && loserId) {
    const loser = getPlayer(state, loserId);
    const moonCount = state.round.centerChips.filter(
      (c) => c === "moon"
    ).length;

    if (loser.chips === 0) {
      moonBonus = moonCount * 5;
    } else if (loser.chips === 1) {
      moonBonus = moonCount * 2;
    }
  }

  const chipsWon = totalChips + VICTORY_BONUS + moonBonus;

  // Determine reveal order: last action player reveals first
  const firstRevealer = state.round.lastActionPlayerId || p1.id;
  const secondRevealer = getOtherPlayerId(state, firstRevealer);

  return {
    cards: { [p1.id]: p1Card, [p2.id]: p2Card },
    totalChips,
    distances: { [p1.id]: p1Distance, [p2.id]: p2Distance },
    winnerId,
    loserId,
    chipsWon,
    moonBonus,
    revealOrder: [firstRevealer, secondRevealer],
  };
}

export function applyRoundResult(
  state: GameState,
  result: RoundResult
): GameState {
  const newState = structuredClone(state);

  if (result.winnerId) {
    const winner = getPlayer(newState, result.winnerId);
    winner.chips += result.chipsWon;
    newState.lastRoundWinner = result.winnerId;
  }

  // Remove used cards from hands (9 can be reused)
  for (const player of newState.players) {
    if (player.selectedCard !== 9) {
      player.hand = player.hand.filter((c) => c !== player.selectedCard);
      player.usedCards.push(player.selectedCard!);
    }
    player.selectedCard = null;
    player.hasChangedThisRound = false;
  }

  // Check game over
  if (checkGameOver(newState)) {
    newState.phase = "game_over";
    newState.winner = determineWinner(newState);
  } else {
    // Start new round
    newState.roundNumber += 1;
    // Alternate starting player
    const nextStarter = getOtherPlayerId(
      newState,
      newState.round.startingPlayerId
    );
    newState.round = createRoundState(nextStarter);
    newState.phase = "card_select";
  }

  return newState;
}

function checkGameOver(state: GameState): boolean {
  // Any player has 0 chips (after round resolution, so they lost all)
  // Actually check if hand size <= MIN_HAND_SIZE
  for (const player of state.players) {
    if (player.hand.length <= MIN_HAND_SIZE) return true;
  }

  return false;
}

function determineWinner(state: GameState): string {
  const [p1, p2] = state.players;

  if (p1.chips > p2.chips) return p1.id;
  if (p2.chips > p1.chips) return p2.id;

  // Tie: last round winner wins
  return state.lastRoundWinner || p1.id;
}
