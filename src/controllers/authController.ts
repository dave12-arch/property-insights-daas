import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: 'error', message: 'Email and password are required' });
      return;
    }

    // 1. Hash the password
    const passwordHash = await hashPassword(password);

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash }])
      .select('id, email, role')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation code
        res.status(409).json({ status: 'error', message: 'Email already exists' });
        return;
      }
      throw error;
    }

    // 3. Generate JWT
    const token = jwt.sign({ id: data.id, role: data.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ status: 'success', data: { user: data, token } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Fetch user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    // 3. Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({ 
      status: 'success', 
      data: { user: { id: user.id, email: user.email, role: user.role }, token } 
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};