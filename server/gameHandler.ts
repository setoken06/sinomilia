import { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GameState,
  ClientGameState,
  PlayerAction,
} from "../src/game/types";
import {
  selectCard,
  performAction,
  resolveRound,
  applyRoundResult,
  getPlayer,
  getOpponent,
} from "../src/game/engine";
import {
  createRoom,
  joinRoom,
  getRoomByPlayerId,
  removePlayer,
  updateGameState,
} from "./roomManager";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function toClientState(state: GameState, playerId: string): ClientGameState {
  const you = getPlayer(state, playerId);
  const opp = getOpponent(state, playerId);

  return {
    roomId: state.roomId,
    you: { ...you },
    opponent: {
      id: opp.id,
      name: opp.name,
      handCount: opp.hand.length,
      chips: opp.chips,
      hasSelectedCard: opp.selectedCard !== null,
      hasChangedThisRound: opp.hasChangedThisRound,
    },
    round: state.round,
    roundNumber: state.roundNumber,
    phase: state.phase,
    winner: state.winner,
    isYourTurn: state.round.currentTurnPlayerId === playerId,
  };
}

export function setupSocketHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on("create_room", ({ playerName }) => {
      const roomId = createRoom(socket.id, playerName);
      socket.join(roomId);
      socket.emit("room_created", { roomId });
    });

    socket.on("join_room", ({ roomId, playerName }) => {
      const result = joinRoom(roomId, socket.id, playerName);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      socket.join(roomId);
      socket.emit("room_joined", { roomId });

      const state = result.gameState!;
      for (const player of result.players) {
        io.to(player.id).emit("game_start", {
          state: toClientState(state, player.id),
        });
      }
    });

    socket.on("select_card", ({ card }) => {
      const room = getRoomByPlayerId(socket.id);
      if (!room?.gameState) return;

      const result = selectCard(room.gameState, socket.id, card);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      updateGameState(room.id, result);

      for (const player of room.players) {
        io.to(player.id).emit("state_update", {
          state: toClientState(result, player.id),
        });
      }
    });

    socket.on("action", (action: PlayerAction) => {
      const room = getRoomByPlayerId(socket.id);
      if (!room?.gameState) return;

      const result = performAction(room.gameState, socket.id, action);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      if (result.phase === "reveal") {
        const roundResult = resolveRound(result);
        const finalState = applyRoundResult(result, roundResult);
        updateGameState(room.id, finalState);

        for (const player of room.players) {
          io.to(player.id).emit("round_end", {
            result: roundResult,
            state: toClientState(finalState, player.id),
          });
        }

        if (finalState.phase === "game_over") {
          for (const player of room.players) {
            io.to(player.id).emit("game_over", {
              winnerId: finalState.winner!,
              state: toClientState(finalState, player.id),
              finalChips: {
                [finalState.players[0].id]: finalState.players[0].chips,
                [finalState.players[1].id]: finalState.players[1].chips,
              },
            });
          }
        }
      } else {
        updateGameState(room.id, result);
        for (const player of room.players) {
          io.to(player.id).emit("state_update", {
            state: toClientState(result, player.id),
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      const room = removePlayer(socket.id);
      if (room) {
        for (const player of room.players) {
          io.to(player.id).emit("opponent_disconnected");
        }
      }
    });
  });
}
