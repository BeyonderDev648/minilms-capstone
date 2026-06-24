// Admin routes - direct port of Flask's admin_users / admin_delete_user / admin_change_role.
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    return res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: "You can't delete your own account." });
  }
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    return res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch(
  '/users/:id/role',
  [body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    try {
      const result = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role', [
        req.body.role,
        req.params.id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }
      return res.json({ user: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update role.' });
    }
  }
);

module.exports = router;
