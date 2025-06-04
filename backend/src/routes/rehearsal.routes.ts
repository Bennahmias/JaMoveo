import express from "express";
import { auth, adminAuth } from "../middleware/auth.middelware";
import { searchSongsController } from "../controllers/song.controller";
import {
  createRehearsalSession,
  joinRehearsalSession,
  selectSong,
  endRehearsalSession,
  getActiveSessions,
} from "../controllers/rehearsal.controller";

const router = express.Router();

// Create a new rehearsal session (admin only)
router.post("/sessions", adminAuth, createRehearsalSession);
router.get("/sessions", auth, getActiveSessions);

// Join an existing rehearsal session
router.post("/sessions/:sessionId/join", auth, joinRehearsalSession);

// Select a song for the session (admin only)
router.post("/sessions/:sessionId/songs", adminAuth, selectSong);

// End a rehearsal session (admin only)
router.delete("/sessions/:sessionId", adminAuth, endRehearsalSession);

router.get("/search", searchSongsController);

export default router;
