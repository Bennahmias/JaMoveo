import { Request, Response } from 'express';
import { searchSongs } from '../utils/songLoader';

export const searchSongsController = (req: Request, res: Response) => {
  const query = req.query.q as string;
  console.log('Song search endpoint hit with query parameter:', query); // Log received query param

  if (!query) {
    console.log('Search query parameter "q" is missing.');
    return res.status(400).json({ message: 'Search query parameter "q" is required' });
  }

  const results = searchSongs(query);
  res.json(results);
};