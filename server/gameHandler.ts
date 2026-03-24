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
  rejoinRoom,
  getRoomBySocketId,
  getPlayerBySocketId,
  disconnectSocket,
  updateGameState,
  getRoom,
} from "./roomManager";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function toClientState(
  state: GameState,
  playerId: string,
  room: { players: { id: string; connected: boolean }[] }
): ClientGameState {
  const you = getPlayer(state, playerId);
  const opp = getOpponent(state, playerId);
  const oppRoom = room.players.find((p) => p.id === opp.id);

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
      usedCards: opp.usedCards,
      isDisconnected: !oppRoom?.connected,
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
    console.log(`Socket connected: ${socket.id}`);

    socket.on("create_room", ({ playerName }) => {
      const { roomId, playerId } = createRoom(socket.id, playerName);
      socket.join(roomId);
      socket.emit("room_created", { roomId });
      // Send playerId to client for reconnection
      (socket as any).emit("player_id", { playerId });
    });

    socket.on("join_room", ({ roomId, playerName }) => {
      const result = joinRoom(roomId, socket.id, playerName);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      const { room, playerId } = result;
      socket.join(roomId);
      socket.emit("room_joined", { roomId });
      (socket as any).emit("player_id", { playerId });

      const state = room.gameState!;
      for (const player of room.players) {
        io.to(player.socketId).emit("game_start", {
          state: toClientState(state, player.id, room),
        });
      }
    });

    socket.on("rejoin_room", ({ roomId, playerId }) => {
      const result = rejoinRoom(roomId, playerId, socket.id);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      const room = result;
      socket.join(roomId);

      if (room.gameState) {
        socket.emit("state_update", {
          state: toClientState(room.gameState, playerId, room),
        });

        // Notify opponent of reconnection
        const opponent = room.players.find((p) => p.id !== playerId);
        if (opponent && opponent.connected) {
          io.to(opponent.socketId).emit("opponent_reconnected");
          io.to(opponent.socketId).emit("state_update", {
            state: toClientState(room.gameState, opponent.id, room),
          });
        }
      }
    });

    socket.on("get_state", () => {
      const room = getRoomBySocketId(socket.id);
      const player = getPlayerBySocketId(socket.id);
      if (!room?.gameState || !player) return;

      socket.emit("state_update", {
        state: toClientState(room.gameState, player.id, room),
      });
    });

    socket.on("select_card", ({ card }) => {
      const room = getRoomBySocketId(socket.id);
      const player = getPlayerBySocketId(socket.id);
      if (!room?.gameState || !player) return;

      const result = selectCard(room.gameState, player.id, card);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      updateGameState(room.id, result);

      for (const p of room.players) {
        if (p.connected) {
          io.to(p.socketId).emit("state_update", {
            state: toClientState(result, p.id, room),
          });
        }
      }
    });

    socket.on("action", (action: PlayerAction) => {
      const room = getRoomBySocketId(socket.id);
      const player = getPlayerBySocketId(socket.id);
      if (!room?.gameState || !player) return;

      const result = performAction(room.gameState, player.id, action);
      if (typeof result === "string") {
        socket.emit("error", { message: result });
        return;
      }

      if (result.phase === "reveal") {
        const roundResult = resolveRound(result);
        const finalState = applyRoundResult(result, roundResult);
        updateGameState(room.id, finalState);

        for (const p of room.players) {
          if (p.connected) {
            io.to(p.socketId).emit("round_end", {
              result: roundResult,
              state: toClientState(finalState, p.id, room),
            });
          }
        }

        if (finalState.phase === "game_over") {
          for (const p of room.players) {
            if (p.connected) {
              io.to(p.socketId).emit("game_over", {
                winnerId: finalState.winner!,
                state: toClientState(finalState, p.id, room),
                finalChips: {
                  [finalState.players[0].id]: finalState.players[0].chips,
                  [finalState.players[1].id]: finalState.players[1].chips,
                },
              });
            }
          }
        }
      } else {
        updateGameState(room.id, result);
        for (const p of room.players) {
          if (p.connected) {
            io.to(p.socketId).emit("state_update", {
              state: toClientState(result, p.id, room),
            });
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const result = disconnectSocket(socket.id);
      if (!result) return;

      const { room, playerId } = result;

      // Notify connected players that opponent is away
      for (const p of room.players) {
        if (p.connected && p.id !== playerId) {
          io.to(p.socketId).emit("opponent_disconnected");
        }
      }
    });
  });
}
