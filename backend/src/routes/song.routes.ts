import express from "express";
import { searchSongsController } from "../controllers/song.controller";

const router = express.Router();

router.get("/search", searchSongsController);

export default router;
