import { Request, Response } from 'express';
import { io } from '../app';
import { getSongByTitle, Song } from '../utils/songLoader'; 


// Store active rehearsal sessions in memory (in production, use a database)
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
      participants: [{
        userId,
        username,
        instrument: req.body.instrument
      }]
    };

    activeSessions.set(sessionId, newSession);

    res.status(201).json({
      sessionId,
      message: 'Rehearsal session created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating rehearsal session', error });
  }
};

export const joinRehearsalSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, username } = req.user!;
    const { instrument } = req.body;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Rehearsal session not found' });
    }

    // Check if user is already in the session
    if (session.participants.some(p => p.userId === userId)) {
      return res.status(400).json({ message: 'Already in session' });
    }

    // Add user to session
    session.participants.push({
      userId,
      username,
      instrument
    });

    // Notify all participants
    io.to(sessionId).emit('participantJoined', {
      userId,
      username,
      instrument
    });

    res.json({
      message: 'Joined rehearsal session successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ message: 'Error joining rehearsal session', error });
  }
};

export const selectSong = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { songTitle } = req.body; // Expect songTitle instead of full song data

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Rehearsal session not found' });
    }

    if (session.adminId !== req.user!.userId) {
      return res.status(403).json({ message: 'Only admin can select songs' });
    }

    // Find the song from the loaded songs by title
    const song = getSongByTitle(songTitle);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Store the full found song object in the session
    session.currentSong = song;

    // Notify all participants about the new song, sending the full Song object
    // The frontend will then process this based on the user's instrument
    io.to(sessionId).emit('songSelected', song);

    res.json({
      message: 'Song selected successfully',
      song: {
        title: song.title,
        artist: song.artist
        // We might not send the full lines back in the HTTP response to keep it light,
        // but it is sent via socket. The frontend can fetch full details if needed
        // or rely entirely on the socket event for live song data.
      }
    });
  } catch (error) {
    console.error('Error selecting song:', error);
    res.status(500).json({ message: 'Error selecting song', error });
  }
};

export const endRehearsalSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Rehearsal session not found' });
    }

    if (session.adminId !== req.user!.userId) {
      return res.status(403).json({ message: 'Only admin can end session' });
    }

    // Notify all participants
    io.to(sessionId).emit('sessionEnded',{ message: 'Session has ended.' });
    console.log(`Admin ${req.user!.userId} is ending session ${sessionId}`);

    // Remove session
    activeSessions.delete(sessionId);

    res.json({ message: 'Rehearsal session ended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error ending rehearsal session', error });
  }
};