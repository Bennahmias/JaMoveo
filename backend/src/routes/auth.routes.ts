import express from "express";
import { register, login, registerAdmin } from "../controllers/auth.controller";
import { auth, adminAuth } from "../middleware/auth.middelware";

const router = express.Router();

router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);

export default router;
