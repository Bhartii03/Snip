import pg from 'pg';
import dotenv from 'dotenv';
import geoip from 'geoip-lite'; // <-- Import the new library

dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const logClickAsync = (urlId, req) => {
  setImmediate(async () => {
    try {
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referrer = req.headers.referer || null;
      
      // 1. Grab the IP Address
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      // 2. [DEV MODE] If testing locally, fake a public IP so we can see the map work!
      if (typeof ip === 'string' && ip.includes(',')) {
         ip = ip.split(',')[0].trim();
      }

      // 3. Translate IP to Location
      const geo = geoip.lookup(ip);
      const country = geo ? geo.country : 'Unknown';
      const city = geo ? geo.city : 'Unknown';

      // 4. Save everything to the database
      await pool.query(
        `INSERT INTO clicks (url_id, referrer, user_agent, country, city) VALUES ($1, $2, $3, $4, $5)`,
        [urlId, referrer, userAgent, country, city]
      );
      
      await pool.query(`UPDATE urls SET click_count = click_count + 1 WHERE id = $1`, [urlId]);
      
      console.log(`📊 Tracked hit from: ${city}, ${country}`);
    } catch (error) {
      console.error('Async analytics error:', error);
    }
  });
};