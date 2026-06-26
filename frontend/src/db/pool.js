// Postgres connection pool, shared across the whole app.
// Uses a single DATABASE_URL connection string - works with Neon, Supabase,
// Render Postgres, Railway, or local Postgres.
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in environment. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Hosted free Postgres providers (Neon/Supabase/Render) require SSL.
// Local Postgres usually doesn't support/need it, so we only force SSL
// when the connection string isn't pointing at localhost.
const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
