import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Join a rehearsal session
    socket.on("joinSession", (sessionId: string) => {
      socket.join(sessionId);
      console.log(
        `User ${socket.data.user.userId} joined session ${sessionId}`,
      );
    });

    // Leave a rehearsal session
    socket.on("leaveSession", (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`User ${socket.data.user.userId} left session ${sessionId}`);
    });

    // Handle scroll synchronization
    socket.on(
      "scrollUpdate",
      (data: { sessionId: string; position: number }) => {
        socket.to(data.sessionId).emit("scrollUpdate", data.position);
      },
    );

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
