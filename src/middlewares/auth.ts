import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('CRITICAL ERROR: JWT_SECRET environment variable is missing.');
}

// Extend the Express Request interface to include the decoded user payload
export interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

/**
 * Middleware to protect routes via JWT verification.
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ 
      status: 'error', 
      message: 'Unauthorized: Missing or invalid authorization header' 
    });
    return; // Stop execution
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach the user payload to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ 
      status: 'error', 
      message: 'Forbidden: Invalid or expired token' 
    });
    return;
  }
};