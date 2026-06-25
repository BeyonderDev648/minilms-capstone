import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') return; // admins are redirected below
    let active = true;
    api
      .get('/courses/dashboard')
      .then(({ data }) => {
        if (active) setCourses(data.courses);
      })
      .catch(() => {
        if (active) setError('Could not load your dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (user?.role === 'admin') return <Navigate to="/admin/users" replace />;

  return (
    <div className="container">
      <div className="section-head">
        <h2>{user.role === 'teacher' ? 'Your courses' : 'Your enrolled courses'}</h2>
        {user.role === 'teacher' && (
          <Link to="/teacher/courses/new" className="btn btn--small"><Plus size={15} /> New course</Link>
        )}
      </div>

      {loading && <p className="loading">Loading…</p>}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && !error && courses.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><BookOpen size={24} /></div>
          <h3>{user.role === 'teacher' ? "You haven't created any courses yet." : "You're not enrolled in anything yet."}</h3>
          {user.role === 'teacher' ? (
            <Link to="/teacher/courses/new" className="btn" style={{ marginTop: 'var(--space-2)' }}>Create your first course</Link>
          ) : (
            <Link to="/courses" className="btn" style={{ marginTop: 'var(--space-2)' }}>Browse available courses</Link>
          )}
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="catalog">
          {courses.map((course, i) => (
            <div className="course-card" key={course.id}>
              <div className="course-card__head">
                <span className="course-card__badge">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="course-card__title">{course.title}</h3>
              </div>
              {course.description && <p className="course-card__desc">{course.description}</p>}
              <div className="course-card__foot">
                <Link
                  className="btn btn--small btn--ghost"
                  to={user.role === 'teacher' ? `/teacher/courses/${course.id}` : `/student/courses/${course.id}`}
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
