import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import Redis from 'ioredis';
import routes from './routes/index.js';
import cors from 'cors';

dotenv.config();

const app = express();
// app.use(cors({ origin: 'http://localhost:5173' }));
app.use(cors({ origin: '*' }));
app.use(express.json()); // Allow JSON requests

// 1. Database Connections
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(async () => {
  console.log('✅ Connected to PostgreSQL');
  // Auto-migrate new geographic columns if they don't exist yet
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      original_url TEXT NOT NULL,
      short_code VARCHAR(20) UNIQUE,
      custom_alias VARCHAR(50) UNIQUE,
      click_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
      clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      referrer TEXT,
      user_agent TEXT,
      country VARCHAR(50),
      city VARCHAR(50)
    );
  `);
  
  console.log('✅ Database Schema Up-To-Date');
}).catch(err => console.error('Database connection error:', err));


const redis = new Redis(process.env.REDIS_URL);
redis.on('connect', () => console.log('✅ Connected to Redis'));

// 2. Use Routes
app.use('/', routes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});