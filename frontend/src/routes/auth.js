// Auth routes - direct port of the Flask prototype's /register and /login,
// but stateless (JWT) instead of session cookies, since both a React web
// client and a Flutter mobile client need to consume this API.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

// POST /api/auth/register
// Mirrors the prototype's rule: only student/teacher are self-registerable.
// Admins are only created via the seed script or by another admin promoting a user.
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role').optional().isIn(['student', 'teacher']).withMessage('Role must be student or teacher.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role === 'teacher' ? 'teacher' : 'student';

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, passwordHash, role]
      );

      const user = result.rows[0];
      const token = signToken(user);
      return res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Registration failed.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      // Same error for "no user" and "wrong password" - don't leak which one.
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signToken(user);
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Login failed.' });
    }
  }
);

// GET /api/auth/me - lets a client (React or Flutter) check who's logged in
// and validate that its stored token is still good.
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load user.' });
  }
});

module.exports = router;
