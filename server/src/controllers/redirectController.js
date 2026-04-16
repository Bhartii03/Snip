import Redis from 'ioredis';
import pg from 'pg';
import dotenv from 'dotenv';
import { logClickAsync } from '../services/analyticsService.js';

dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);

export const handleRedirect = async (req, res) => {
  const { code } = req.params;

  try {
    // 1. Check Redis Cache First (~1ms response time)
    const cachedUrl = await redis.get(`url:${code}`);
    if (cachedUrl) {
      const { original_url, id } = JSON.parse(cachedUrl);
      res.redirect(original_url);
      logClickAsync(id, req); // Log click in background
      return;
    }

    // 2. Cache Miss: Check PostgreSQL Database
    const { rows } = await pool.query(
      `SELECT id, original_url FROM urls WHERE short_code = $1 OR custom_alias = $1`,
      [code]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'URL not found' });

    const urlData = rows[0];

    // 3. Save to Cache for next time (Expires in 1 hour) & Redirect
    await redis.setex(`url:${code}`, 3600, JSON.stringify(urlData));
    res.redirect(urlData.original_url);
    
    // 4. Log click in background
    logClickAsync(urlData.id, req);

  } catch (error) {
    console.error("🔥 REDIRECT ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};