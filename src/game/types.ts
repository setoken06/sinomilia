export type ChipSide = "sun" | "moon";

export type PlayerAction =
  | { type: "place_chip"; side: ChipSide }
  | { type: "change_card"; newCard: number }
  | { type: "pass" };

export interface PlayerState {
  id: string;
  name: string;
  hand: number[];
  chips: number;
  selectedCard: number | null;
  hasChangedThisRound: boolean;
}

export interface RoundState {
  centerChips: ChipSide[];
  startingPlayerId: string;
  currentTurnPlayerId: string;
  lastActionPlayerId: string | null;
  lastAction: PlayerAction | null;
  consecutivePasses: number;
  firstPassPlayerId: string | null;
  changeJustPerformed: boolean;
}

export interface GameState {
  roomId: string;
  players: [PlayerState, PlayerState];
  round: RoundState;
  roundNumber: number;
  phase: "waiting" | "card_select" | "action" | "reveal" | "game_over";
  winner: string | null;
  lastRoundWinner: string | null;
}

export interface RoundResult {
  cards: { [playerId: string]: number };
  totalChips: number;
  distances: { [playerId: string]: number };
  winnerId: string | null;
  loserId: string | null;
  chipsWon: number;
  moonBonus: number;
  revealOrder: [string, string]; // first reveals, then second
}

export interface ClientGameState {
  roomId: string;
  you: PlayerState;
  opponent: {
    id: string;
    name: string;
    handCount: number;
    chips: number;
    hasSelectedCard: boolean;
    hasChangedThisRound: boolean;
  };
  round: RoundState;
  roundNumber: number;
  phase: GameState["phase"];
  winner: string | null;
  isYourTurn: boolean;
}

// Socket events
export interface ServerToClientEvents {
  room_created: (data: { roomId: string }) => void;
  room_joined: (data: { roomId: string }) => void;
  game_start: (data: { state: ClientGameState }) => void;
  state_update: (data: { state: ClientGameState }) => void;
  round_end: (data: { result: RoundResult; state: ClientGameState }) => void;
  game_over: (data: {
    winnerId: string;
    state: ClientGameState;
    finalChips: { [playerId: string]: number };
  }) => void;
  opponent_disconnected: () => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string }) => void;
  join_room: (data: { roomId: string; playerName: string }) => void;
  select_card: (data: { card: number }) => void;
  action: (data: PlayerAction) => void;
}
