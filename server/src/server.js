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
    ALTER TABLE clicks 
    ADD COLUMN IF NOT EXISTS country VARCHAR(50),
    ADD COLUMN IF NOT EXISTS city VARCHAR(50);
  `);
  console.log('✅ Database Schema Up-To-Date');
});

const redis = new Redis(process.env.REDIS_URL);
redis.on('connect', () => console.log('✅ Connected to Redis'));

// 2. Use Routes
app.use('/', routes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});