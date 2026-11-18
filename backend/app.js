const path = require('node:path');
const express = require('express');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '.env.mysql'), quiet: true });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
  connectTimeout: 3000,
});

const port = Number(process.env.PORT || 3000);
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/events', async (req, res) => {
  try {
    const [events] = await pool.query(
      'SELECT id, name, venue, starts_at AS startsAt, price_ugx AS priceUgx FROM events ORDER BY starts_at, id'
    );
    res.json(events);
  } catch (error) {
    console.error('Events query failed:', error.code || error.message);
    res.status(503).json({ error: 'Events are temporarily unavailable' });
  }
});

app.listen(port, () => {
  console.log(`Parre backend running on port ${port}`);
});
