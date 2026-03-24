"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/game/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(): TypedSocket {
  const socketRef = useRef<TypedSocket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      // Don't disconnect on unmount - keep connection alive
    };
  }, []);

  return socketRef.current;
}
