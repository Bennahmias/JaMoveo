import { Request, Response } from "express";
import { io } from "../app";
import { getSongByTitle, Song } from "../utils/songLoader";

// Store active rehearsal sessions in memory
interface RehearsalSession {
  id: string;
  adminId: string;
  currentSong: Song | null;
  participants: {
    userId: string;
    username: string;
    instrument: string;
  }[];
}

const activeSessions: Map<string, RehearsalSession> = new Map();

export const createRehearsalSession = async (req: Request, res: Response) => {
  try {
    const { userId, username } = req.user!;

    const sessionId = Math.random().toString(36).substring(2, 15);
    const newSession: RehearsalSession = {
      id: sessionId,
      adminId: userId,
      currentSong: null,
      participants: [
        {
          userId,
          username,
          instrument: req.body.instrument,
        },
      ],
    };

    activeSessions.set(sessionId, newSession);

    res.status(201).json({
      sessionId,
      message: "Rehearsal session created successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating rehearsal session", error });
  }
};

export const joinRehearsalSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, username } = req.user!;
    const { instrument } = req.body;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Rehearsal session not found" });
    }

    // Check if user is already in the session
    const existingParticipant = session.participants.find(
      (p) => p.userId === userId,
    );
    if (existingParticipant) {
      // If user is already in session, just return success
      return res.json({
        message: "Rejoined rehearsal session successfully",
        session,
        currentSong: session.currentSong,
      });
    }

    // Add new user to session
    session.participants.push({
      userId,
      username,
      instrument,
    });

    // Notify all participants
    io.to(sessionId).emit("participantJoined", {
      userId,
      username,
      instrument,
    });

    res.json({
      message: "Joined rehearsal session successfully",
      session,
      currentSong: session.currentSong,
    });
  } catch (error) {
    res.status(500).json({ message: "Error joining rehearsal session", error });
  }
};

export const selectSong = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { songTitle } = req.body;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Rehearsal session not found" });
    }

    if (session.adminId !== req.user!.userId) {
      return res.status(403).json({ message: "Only admin can select songs" });
    }

    const song = getSongByTitle(songTitle);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    session.currentSong = song;

    // Emit to the specific room
    io.to(sessionId).emit("songSelected", song);

    res.json({
      message: "Song selected successfully",
      song,
    });
  } catch (error) {
    console.error("Error selecting song:", error);
    res.status(500).json({ message: "Error selecting song", error });
  }
};

export const endRehearsalSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Rehearsal session not found" });
    }

    if (session.adminId !== req.user!.userId) {
      return res.status(403).json({ message: "Only admin can end session" });
    }

    // Notify all participants
    io.to(sessionId).emit("sessionEnded", { message: "Session has ended." });
    console.log(`Admin ${req.user!.userId} is ending session ${sessionId}`);

    // Remove session
    activeSessions.delete(sessionId);

    res.json({ message: "Rehearsal session ended successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error ending rehearsal session", error });
  }
};
// Get all active sessions
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const sessions = Array.from(activeSessions.values()).map((session) => {
      // Find the admin participant
      const admin = session.participants.find(p => p.userId === session.adminId);
      return {
        id: session.id,
        participants: session.participants.length,
        adminName: admin ? admin.username : 'Unknown Admin'
      };
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Error getting active sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
