import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/game/types";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({ autoConnect: false }) as TypedSocket;
  }
  return socket;
}

// Persist player/room identity for reconnection (survives tab close)
export function saveSession(roomId: string, playerId: string): void {
  try {
    localStorage.setItem("sinomilia_roomId", roomId);
    localStorage.setItem("sinomilia_playerId", playerId);
  } catch {}
}

export function getSession(): { roomId: string; playerId: string } | null {
  try {
    const roomId = localStorage.getItem("sinomilia_roomId");
    const playerId = localStorage.getItem("sinomilia_playerId");
    if (roomId && playerId) return { roomId, playerId };
  } catch {}
  return null;
}

export function clearSession(): void {
  try {
    localStorage.removeItem("sinomilia_roomId");
    localStorage.removeItem("sinomilia_playerId");
  } catch {}
}
