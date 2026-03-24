import { GameState } from "../src/game/types";
import { initializeGame } from "../src/game/engine";

interface Room {
  id: string;
  players: { id: string; name: string }[];
  gameState: GameState | null;
}

const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

export function createRoom(playerId: string, playerName: string): string {
  const roomId = generateRoomId();
  const room: Room = {
    id: roomId,
    players: [{ id: playerId, name: playerName }],
    gameState: null,
  };
  rooms.set(roomId, room);
  playerToRoom.set(playerId, roomId);
  return roomId;
}

export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string
): Room | string {
  const room = rooms.get(roomId);
  if (!room) return "ルームが見つかりません";
  if (room.players.length >= 2) return "ルームが満員です";

  room.players.push({ id: playerId, name: playerName });
  playerToRoom.set(playerId, roomId);

  // Start the game
  const [p1, p2] = room.players;
  room.gameState = initializeGame(roomId, p1.id, p1.name, p2.id, p2.name);

  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByPlayerId(playerId: string): Room | undefined {
  const roomId = playerToRoom.get(playerId);
  return roomId ? rooms.get(roomId) : undefined;
}

export function removePlayer(playerId: string): Room | undefined {
  const roomId = playerToRoom.get(playerId);
  if (!roomId) return undefined;

  playerToRoom.delete(playerId);
  const room = rooms.get(roomId);
  if (!room) return undefined;

  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
    return undefined;
  }

  return room;
}

export function updateGameState(roomId: string, state: GameState): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState = state;
  }
}
