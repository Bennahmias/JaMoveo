import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes";
import rehearsalRoutes from "./routes/rehearsal.routes";
import { setupSocketHandlers } from "./socket/socketHandlers";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// HTTP server
const httpServer = createServer(app);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Debug info here" });
});

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Database connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rehearsal", rehearsalRoutes);


// Setup Socket.IO handlers
setupSocketHandlers(io);

export { app, httpServer, io };
