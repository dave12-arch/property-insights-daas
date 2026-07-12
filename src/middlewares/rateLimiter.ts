import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 100;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Use IP address as the identifier (or req.user.id if authenticated)
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const redisKey = `rate_limit:${ip}`;

  try {
    const currentRequests = await redisClient.incr(redisKey);

    // If it's the first request in the window, set the expiration timer
    if (currentRequests === 1) {
      await redisClient.expire(redisKey, WINDOW_SECONDS);
    }

    if (currentRequests > MAX_REQUESTS_PER_WINDOW) {
      res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Rate Limiter Redis Error:', error);
    // If Redis fails, we "fail open" so legitimate traffic isn't blocked by our own outage
    next(); 
  }
};