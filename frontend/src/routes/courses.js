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
        `SELECT c.*, e.status AS enrollment_status FROM courses c
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
// their request status for each one (no request yet / pending / approved / rejected).
router.get('/browse', requireRole('student'), async (req, res) => {
  try {
    const courses = await pool.query(
      `SELECT c.*, u.name AS teacher_name FROM courses c
       JOIN users u ON u.id = c.teacher_id
       ORDER BY c.id`
    );
    const mine = await pool.query('SELECT course_id, status FROM enrollments WHERE student_id = $1', [req.user.id]);
    const statusByCourse = {};
    mine.rows.forEach((row) => {
      statusByCourse[row.course_id] = row.status;
    });

    return res.json({ courses: courses.rows, statusByCourse });
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
       WHERE e.course_id = $1 AND e.status = 'approved'
       ORDER BY u.name`,
      [courseId]
    );
    const pendingRequests = await pool.query(
      `SELECT e.id AS enrollment_id, u.id AS student_id, u.name, u.email, e.created_at AS requested_at
       FROM enrollments e
       JOIN users u ON u.id = e.student_id
       WHERE e.course_id = $1 AND e.status = 'pending'
       ORDER BY e.created_at`,
      [courseId]
    );

    return res.json({
      course: course.rows[0],
      lessons: lessons.rows,
      students: students.rows,
      pendingRequests: pendingRequests.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load course.' });
  }
});

// GET /api/courses/student/:id
// Equivalent of Flask's student_course_detail() - only visible once approved.
// A pending or rejected request does not grant access to lesson content.
router.get('/student/:id', requireRole('student'), async (req, res) => {
  const courseId = req.params.id;
  try {
    const enrollment = await pool.query('SELECT status FROM enrollments WHERE student_id = $1 AND course_id = $2', [
      req.user.id,
      courseId,
    ]);

    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'You have not requested enrollment in this course.' });
    }
    const status = enrollment.rows[0].status;
    if (status === 'pending') {
      return res.status(403).json({ error: 'Your enrollment request is still pending teacher approval.' });
    }
    if (status === 'rejected') {
      return res.status(403).json({ error: 'Your enrollment request for this course was declined.' });
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
// Submits an enrollment REQUEST - this does not grant access by itself.
// The course's teacher must approve it before the student can see lesson
// content. A decision (approved or rejected) is final - there is no
// re-requesting after a rejection, and no way to cancel/leave once a
// request exists. This is an intentional design decision (see note below
// near the approve/reject routes), not an oversight.
router.post('/:id/enroll', requireRole('student'), async (req, res) => {
  const courseId = req.params.id;
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const existing = await pool.query('SELECT status FROM enrollments WHERE student_id = $1 AND course_id = $2', [
      req.user.id,
      courseId,
    ]);

    if (existing.rows.length > 0) {
      const status = existing.rows[0].status;
      if (status === 'pending') {
        return res.status(409).json({ error: 'Your enrollment request is already pending approval.' });
      }
      if (status === 'approved') {
        return res.status(409).json({ error: 'You are already enrolled in this course.' });
      }
      // status === 'rejected' - final, no re-requesting
      return res.status(409).json({ error: 'Your request for this course was already declined and cannot be resubmitted.' });
    }

    const result = await pool.query(
      "INSERT INTO enrollments (student_id, course_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [req.user.id, courseId]
    );
    return res.status(201).json({ message: 'Enrollment request submitted.', enrollment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit enrollment request.' });
  }
});

// POST /api/courses/:id/requests/:enrollmentId/approve
// Teacher approves a pending enrollment request for their own course.
router.post('/:id/requests/:enrollmentId/approve', requireRole('teacher'), async (req, res) => {
  const { id: courseId, enrollmentId } = req.params;
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [
      courseId,
      req.user.id,
    ]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const result = await pool.query(
      "UPDATE enrollments SET status = 'approved' WHERE id = $1 AND course_id = $2 AND status = 'pending' RETURNING *",
      [enrollmentId, courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending request not found.' });
    }
    return res.json({ enrollment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to approve request.' });
  }
});

// POST /api/courses/:id/requests/:enrollmentId/reject
// Teacher declines a pending enrollment request for their own course.
router.post('/:id/requests/:enrollmentId/reject', requireRole('teacher'), async (req, res) => {
  const { id: courseId, enrollmentId } = req.params;
  try {
    const course = await pool.query('SELECT id FROM courses WHERE id = $1 AND teacher_id = $2', [
      courseId,
      req.user.id,
    ]);
    if (course.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const result = await pool.query(
      "UPDATE enrollments SET status = 'rejected' WHERE id = $1 AND course_id = $2 AND status = 'pending' RETURNING *",
      [enrollmentId, courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending request not found.' });
    }
    return res.json({ enrollment: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to reject request.' });
  }
});

// Note: there is intentionally no endpoint to delete/cancel an enrollment
// once submitted, and no endpoint for a student to remove their own
// approved enrollment ("leave a course"). This is a deliberate design
// decision, not an oversight - once a request exists, only a teacher's
// approve/reject action (or an admin deleting the account entirely, which
// cascades) can change it.

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
