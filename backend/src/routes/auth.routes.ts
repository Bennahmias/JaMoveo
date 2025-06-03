import express from "express";
import { register, login, registerAdmin } from "../controllers/auth.controller";
import { auth, adminAuth } from "../middleware/auth.middelware";

const router = express.Router();

// Public routes (no auth needed)
router.post("/register", register);
router.post("/register-admin", registerAdmin);
router.post("/login", login);

// Protected routes (auth needed)
router.get("/profile", auth, (req, res) => {
  // Only authenticated users can access this
});
// Admin only routes
router.get("/admin-dashboard", adminAuth, (req, res) => {
  // Only admin users can access this
});

export default router;
