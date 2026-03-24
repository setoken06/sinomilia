import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/game/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io({ autoConnect: false }) as TypedSocket;
  }
  return socket;
}
