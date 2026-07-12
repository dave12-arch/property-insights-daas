import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Define the Redis client
export const redisClient = createClient({
  // If you have a remote Redis URL (like Upstash), add it to your .env and use it here:
  // url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client initialized and ready.');
});

// ESM allows top-level await, which is perfect for initializing connections before the app fully boots
try {
  await redisClient.connect();
} catch (error) {
  console.error('Failed to connect to Redis. Is your Redis server running?', error);
  // Depending on your deployment, you might want to process.exit(1) here if Redis is strictly required
}