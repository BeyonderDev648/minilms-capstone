// One-time seed script - creates the initial admin account, same as the
// Flask prototype's init_db() did automatically on first run.
// Run once after applying schema.sql:
//   npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const existing = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
  if (Number(existing.rows[0].count) > 0) {
    console.log('An admin account already exists - skipping seed.');
    return process.exit(0);
  }

  const passwordHash = await bcrypt.hash('admin123', 12);
  await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
    'Admin',
    'admin@lms.local',
    passwordHash,
    'admin',
  ]);

  console.log('Seeded admin account:');
  console.log('  email:    admin@lms.local');
  console.log('  password: admin123');
  console.log('Change this password immediately after first login in any real deployment.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
