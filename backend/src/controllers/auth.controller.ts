import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { generateToken } from '../utils/jwt';


export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, instrument, isAdmin } = req.body;


    // Check if username is empty
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username cannot be empty.' });
    }

    // Check password length
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check password complexity (at least one uppercase, one lowercase, one number)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' });
    }


    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      password,
      instrument,
      isAdmin: isAdmin || false
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAdmin: user.isAdmin
    });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        instrument: user.instrument,
        isAdmin: user.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, instrument } = req.body;

    // Reuse validation from regular register
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username cannot be empty.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      username,
      password,
      instrument,
      isAdmin: true
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAdmin: user.isAdmin
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        instrument: user.instrument,
        isAdmin: user.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error during admin registration:', error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'user not exists' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      isAdmin: user.isAdmin
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        instrument: user.instrument,
        isAdmin: user.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};