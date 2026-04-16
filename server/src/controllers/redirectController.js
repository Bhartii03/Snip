import Redis from 'ioredis';
import pg from 'pg';
import dotenv from 'dotenv';
import { logClickAsync } from '../services/analyticsService.js';

dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);
redis.on('error', (err) => console.warn('Redis warning ignored:', err.message));

export const handleRedirect = async (req, res) => {
  const { code } = req.params;

  try {
    // 1. ISOLATED CACHE READ - If this fails, we just pretend it was a cache miss!
    let cachedUrl = null;
    try {
      cachedUrl = await redis.get(code);
    } catch (redisErr) {
      console.warn("⚠️ Cache read failed, degrading to PostgreSQL:", redisErr.message);
    }

    // If we found it in the cache, redirect instantly
    if (cachedUrl) {
      logClickAsync(code, req); // Make sure this matches how your analytics logging works!
      return res.redirect(cachedUrl);
    }

    // 2. THE FALLBACK - Get it from the database
    const { rows } = await pool.query(
      'SELECT id, original_url FROM urls WHERE short_code = $1 OR custom_alias = $1', 
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const originalUrl = rows[0].original_url;
    const urlId = rows[0].id;

    // 3. ISOLATED CACHE WRITE - If Redis is down, we don't care if this fails.
    try {
      await redis.set(code, originalUrl);
    } catch (redisErr) {
      console.warn("⚠️ Cache write failed, moving on:", redisErr.message);
    }

    // 4. Track and Redirect
    logClickAsync(urlId, req); 
    return res.redirect(originalUrl);

  } catch (err) {
    // This will now ONLY trigger if PostgreSQL completely dies.
    console.error("🔥 FATAL REDIRECT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};