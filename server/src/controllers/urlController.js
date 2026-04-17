import pg from 'pg';
import dotenv from 'dotenv';
import { generateBase62 } from '../utils/base62.js';
import QRCode from 'qrcode';

dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const createUrl = async (req, res) => {
  const { originalUrl, customAlias } = req.body;
  
  try {
    let shortCode = customAlias || null;
    
    if (!shortCode) {
      let isUnique = false;
      while (!isUnique) {
        shortCode = generateBase62();
        const check = await pool.query('SELECT id FROM urls WHERE short_code = $1', [shortCode]);
        if (check.rows.length === 0) isUnique = true;
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO urls (original_url, short_code, custom_alias) 
       VALUES ($1, $2, $3) RETURNING *`,
      [originalUrl, customAlias ? null : shortCode, customAlias || null]
    );

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const fullUrl = `${baseUrl}/${shortCode}`;
    const qrCode = await QRCode.toDataURL(fullUrl);

    res.status(201).json({ url: rows[0], fullUrl, qrCode });
  } catch (error) {
    console.error("🔥 DB ERROR:", error);
    if (error.code === '23505') return res.status(409).json({ error: 'Alias already exists' });
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const statsQuery = await pool.query(
      `SELECT COUNT(*) as total_urls, COALESCE(SUM(click_count), 0) as total_clicks 
       FROM urls`
    );

    const chartQuery = await pool.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM clicks
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC 
       LIMIT 7`
    );

    const geoQuery = await pool.query(
      `SELECT city as location, COUNT(*) as clicks 
       FROM clicks 
       WHERE city IS NOT NULL AND city != 'Unknown' AND city != ''
       GROUP BY city 
       ORDER BY clicks DESC 
       LIMIT 5`
    );

    res.json({
      stats: statsQuery.rows[0],
      chartData: chartQuery.rows.reverse(),
      geoData: geoQuery.rows 
    });
  } catch (error) {
    console.error("🔥 STATS ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBatchStats = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }

    const { rows } = await pool.query(
      `SELECT id, click_count FROM urls WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    res.json(rows);
  } catch (error) {
    console.error("🔥 BATCH STATS ERROR:", error);
    res.status(500).json({ error: 'Server error' });
  }
};