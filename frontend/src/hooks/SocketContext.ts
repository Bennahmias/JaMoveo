import { createContext } from "react";
import type { Socket } from "socket.io-client";

interface ISocketContext {
  socket: Socket | null;
  isConnected: boolean;
}

// Create the context with a default undefined value
export const SocketContext = createContext<ISocketContext | undefined>(
  undefined,
);
