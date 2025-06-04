import { Request, Response } from "express";
import { searchSongs } from "../utils/songLoader";

export const searchSongsController = (req: Request, res: Response) => {
  const query = req.query.q as string;
  const results = searchSongs(query);
  res.json(results);
};
