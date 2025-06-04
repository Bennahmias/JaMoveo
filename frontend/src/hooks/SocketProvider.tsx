import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { SocketContext } from "./SocketContext";

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth(); 
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Logic to connect or disconnect based on token presence
    if (!token) {
      console.log(
        "No token available, disconnecting or skipping socket connection.",
      );
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return; // Stop here if no token
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    // Attempt to connect
    const newSocket = io(backendUrl, {
      auth: {
        token: token, // Send the JWT token
      },
      transports: ["websocket"],
    });

    // Setup listeners
    newSocket.on("connect", () => {
      console.log("Socket connected successfully:", newSocket.id);
      setIsConnected(true);
    });
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });
    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    setSocket(newSocket); // Store the active socket instance

    // Cleanup function
    return () => {
      console.log("Cleaning up socket connection.");
      if (newSocket) {
        newSocket.disconnect(); //removes event listeners
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // token is the only safe and necessary dependency

  // Provide the socket and connection status via context
  const contextValue = { socket, isConnected };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
