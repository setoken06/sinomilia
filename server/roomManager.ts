import { GameState } from "../src/game/types";
import { initializeGame } from "../src/game/engine";

interface Room {
  id: string;
  players: { id: string; name: string; socketId: string; connected: boolean }[];
  gameState: GameState | null;
}

const rooms = new Map<string, Room>();
// socketId -> roomId
const socketToRoom = new Map<string, string>();
// playerId -> roomId (persistent across reconnections)
const playerToRoom = new Map<string, string>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
}

export function createRoom(socketId: string, playerName: string): { roomId: string; playerId: string } {
  const roomId = generateRoomId();
  const playerId = generatePlayerId();
  const room: Room = {
    id: roomId,
    players: [{ id: playerId, name: playerName, socketId, connected: true }],
    gameState: null,
  };
  rooms.set(roomId, room);
  socketToRoom.set(socketId, roomId);
  playerToRoom.set(playerId, roomId);
  return { roomId, playerId };
}

export function joinRoom(
  roomId: string,
  socketId: string,
  playerName: string
): { room: Room; playerId: string } | string {
  const room = rooms.get(roomId);
  if (!room) return "ルームが見つかりません";
  if (room.players.length >= 2) return "ルームが満員です";

  const playerId = generatePlayerId();
  room.players.push({ id: playerId, name: playerName, socketId, connected: true });
  socketToRoom.set(socketId, roomId);
  playerToRoom.set(playerId, roomId);

  // Start the game
  const [p1, p2] = room.players;
  room.gameState = initializeGame(roomId, p1.id, p1.name, p2.id, p2.name);

  return { room, playerId };
}

export function rejoinRoom(
  roomId: string,
  playerId: string,
  newSocketId: string
): Room | string {
  const room = rooms.get(roomId);
  if (!room) return "ルームが見つかりません";

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return "プレイヤーが見つかりません";

  // Clean up old socket mapping
  socketToRoom.delete(player.socketId);

  // Update socket ID and mark as connected
  player.socketId = newSocketId;
  player.connected = true;
  socketToRoom.set(newSocketId, roomId);

  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  const roomId = socketToRoom.get(socketId);
  return roomId ? rooms.get(roomId) : undefined;
}

export function getPlayerBySocketId(socketId: string): { id: string; name: string; socketId: string; connected: boolean } | undefined {
  const room = getRoomBySocketId(socketId);
  if (!room) return undefined;
  return room.players.find((p) => p.socketId === socketId);
}

export function disconnectSocket(socketId: string): { room: Room; playerId: string } | undefined {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return undefined;

  const room = rooms.get(roomId);
  if (!room) return undefined;

  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return undefined;

  player.connected = false;
  socketToRoom.delete(socketId);

  // If all players disconnected and no game in progress, clean up
  const allDisconnected = room.players.every((p) => !p.connected);
  if (allDisconnected && !room.gameState) {
    rooms.delete(roomId);
    for (const p of room.players) {
      playerToRoom.delete(p.id);
    }
    return undefined;
  }

  return { room, playerId: player.id };
}

export function updateGameState(roomId: string, state: GameState): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState = state;
  }
}

function generatePlayerId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "p_";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
