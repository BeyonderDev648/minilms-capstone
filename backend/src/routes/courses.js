// Courses + lessons + enrollment routes.
// This is a 1:1 mapping of the Flask prototype's routes, just as JSON
// endpoints instead of rendered templates. Route names below match the
// original Flask route names in comments so you can cross-reference app.py.

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require a logged-in user.
router.use(requireAuth);

// GET /api/courses/dashboard
// Equivalent of Flask's @app.route("/dashboard") for teacher/student.
// (Admin's dashboard view lives in routes/admin.js -> GET /api/admin/users)
router.get('/dashboard', async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const result = await pool.query('SELECT * FROM courses WHERE teacher_id = $1 ORDER BY id', [req.user.id]);
      return res.json({ role: 'teacher', courses: result.rows });
    }

    if (req.user.role === 'student') {
      const result = await pool.query(
        `SELECT c.* FROM courses c
         JOIN enrollments e ON e.course_id = c.id
         WHERE e.student_id = $1
         ORDER BY c.id`,
        [req.user.id]
      );
      return res.json({ role: 'student', courses: result.rows });
    }

    // admins should hit /api/admin/users instead
    return res.status(403).json({ error: 'Admins should use /api/admin/users.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// GET /api/courses/browse
// Equivalent of Flask's browse_courses() - students see every course plus
// which ones they're already enrolled in.
router.get('/browse', requireRole('student'), async (req, res) => {
  try {
    const courses = await pool.query(
      `SELECT c.*, u.name AS teacher_name FROM courses c
       JOIN users u ON u.id = c.teacher_id
       ORDER BY c.id`
    );
    const enrolled = await pool.query('SELECT course_id FROM enrollments WHERE student_id = $1', [req.user.id]);
    const enrolledIds = enrolled.rows.map((r) => r.course_id);

    return res.json({ courses: courses.rows, enrolledIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load courses.' });
  }
});

// POST /api/courses
// Equivalent of Flask's create_course()
router.post(
  '/',
  requireRole('teacher'),
  [body('title').trim().notEmpty().withMessage('Title is required.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const title = req.body.title.trim();
    const description = (req.body.description || '').trim();

    try {
      const result = await pool.query(
        'INSERT INTO courses (title, description, teacher_id) VALUES ($1, $2, $3) RETURNING *',
        [title, description, req.user.id]
      );
      return res.status(201).json({ course: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create course.' });
    }
  }
);

// GET /api/courses/teacher/:id
// Equivalent of Flask's teacher_course_detail() - course + lessons + enrolled students.
// Only the owning teacher can view this.
router.get('/teacher/:id', requireRole('teacher'), async (req, res) => {
  const courseId = req.params.id;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1 AND teacher_id = $2', [
      courseId,
      req.user.id,
    ]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const lessons = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY id', [courseId]);
    const students = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u
       JOIN enrollments e ON e.student_id = u.id
       WHERE e.course_id = $1
       ORDER BY u.name`,
      [courseId]
    );

    return res.json({ course: course.rows[0], lessons: lessons.rows, students: students.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load course.' });
  }
});

// GET /api/courses/student/:id
// Equivalent of Flask's student_course_detail() - only visible if enrolled.
router.get('/student/:id', requireRole('student'), async (req, res) => {
  const courseId = req.params.id;
  try {
    const enrolled = await pool.query('SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2', [
      req.user.id,
      courseId,
    ]);
    if (enrolled.rows.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const lessons = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY id', [courseId]);
    return res.json({ course: course.rows[0], lessons: lessons.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load course.' });
  }
});

// POST /api/courses/:id/enroll
// Equivalent of Flask's enroll_course()
router.post('/:id/enroll', requireRole('student'), async (req, res) => {
  const courseId = req.params.id;
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const already = await pool.query('SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2', [
      req.user.id,
      courseId,
    ]);
    if (already.rows.length > 0) {
      return res.status(409).json({ error: 'Already enrolled.' });
    }

    await pool.query('INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)', [req.user.id, courseId]);
    return res.status(201).json({ message: 'Enrolled successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to enroll.' });
  }
});

// POST /api/courses/:id/lessons
// Equivalent of Flask's upload_lesson()
router.post(
  '/:id/lessons',
  requireRole('teacher'),
  [body('title').trim().notEmpty().withMessage('Lesson title is required.')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const courseId = req.params.id;
    const title = req.body.title.trim();
    const content = (req.body.content || '').trim();

    try {
      const course = await pool.query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [
        courseId,
        req.user.id,
      ]);
      if (course.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found.' });
      }

      const result = await pool.query(
        'INSERT INTO lessons (course_id, title, content) VALUES ($1, $2, $3) RETURNING *',
        [courseId, title, content]
      );
      return res.status(201).json({ lesson: result.rows[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to upload lesson.' });
    }
  }
);

module.exports = router;
