import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();
const redis = new Redis(process.env.REDIS_URL);
redis.on('error', (err) => console.warn('Redis warning ignored:', err.message));
// Limit: 20 requests per minute per IP
const RATE_LIMIT = 20;
const WINDOW_SECONDS = 60;

export const createUrlLimiter = async (req, res, next) => {
  // Use a fake IP for local testing if needed, or grab the real one
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const redisKey = `rate_limit:${ip}`;

  try {
    // Increment the request count for this IP
    const requests = await redis.incr(redisKey);

    // If this is their first request, set the expiration timer (60 seconds)
    if (requests === 1) {
      await redis.expire(redisKey, WINDOW_SECONDS);
    }

    if (requests > RATE_LIMIT) {
      return res.status(429).json({ 
        error: 'Too many SNIPs created. Please wait a minute before trying again.' 
      });
    }

    next(); // IP is safe, continue to the controller
  } catch (error) {
    console.error("Rate Limiter Error:", error);
    next(); // If Redis fails, let the request through so the app doesn't break
  }
};