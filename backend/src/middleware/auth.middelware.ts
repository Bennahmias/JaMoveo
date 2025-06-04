import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../utils/jwt";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

export const adminAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await auth(req, res, () => {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied. Admin only." });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};
