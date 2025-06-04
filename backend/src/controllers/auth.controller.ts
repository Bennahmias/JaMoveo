import { Request, Response } from "express";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt";

// Utility functions
const createAuthResponse = (user: any, token: string) => ({
  token,
  user: {
    id: user._id,
    username: user.username,
    instrument: user.instrument,
    isAdmin: user.isAdmin,
  },
});

const generateUserToken = (user: any) =>
  generateToken({
    userId: user._id.toString(),
    username: user.username,
    isAdmin: user.isAdmin,
  });

// Generic registration function
const registerUser = async (req: Request, res: Response, isAdmin: boolean) => {
  try {
    const { username, password, instrument } = req.body;

    await registerValidation(username, password, res);

    const user = new User({
      username,
      password,
      instrument,
      isAdmin,
    });

    await user.save();
    const token = generateUserToken(user);
    res.status(201).json(createAuthResponse(user, token));
  } catch (error: any) {
    console.error(
      `Error during ${isAdmin ? "admin" : "user"} registration:`,
      error,
    );
    res.status(500).json({
      message: `Error creating ${isAdmin ? "admin" : "user"}`,
      error: error.message,
    });
  }
};

export const register = (req: Request, res: Response) =>
  registerUser(req, res, false);
export const registerAdmin = (req: Request, res: Response) =>
  registerUser(req, res, true);

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "user not exists" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateUserToken(user);
    res.json(createAuthResponse(user, token));
  } catch (error: any) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

async function registerValidation(username: any, password: any, res: Response) {
  // Reuse validation from regular register
  if (!username || username.trim() === "") {
    return res.status(400).json({ message: "Username cannot be empty." });
  }

  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return res.status(400).json({
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    });
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "Username already exists" });
  }
}
