import { useEffect, useState } from 'react';
import api from '../api/client';

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollingId, setEnrollingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/courses/browse')
      .then(({ data }) => {
        setCourses(data.courses);
        setEnrolledIds(data.enrolledIds);
      })
      .catch(() => setError('Could not load courses.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time fetch-on-mount; a data-fetching library (React Query/SWR) is the "correct" long-term answer to this lint rule, but out of scope for this project's timeline
    load();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrolledIds((prev) => [...prev, courseId]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not enroll.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="container">
      <h1>Browse courses</h1>
      <p style={{ color: 'var(--ink-soft)' }}>Every course currently offered, across all teachers.</p>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <p className="loading">Loading…</p>}

      {!loading && courses.length === 0 && (
        <div className="empty-state">
          <h3>No courses have been created yet.</h3>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="ledger">
          {courses.map((course, i) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <div className="ledger__row" key={course.id}>
                <div className="ledger__index">{String(i + 1).padStart(2, '0')}</div>
                <div className="ledger__body">
                  <h3 className="ledger__title">{course.title}</h3>
                  <p className="ledger__meta">Taught by {course.teacher_name}</p>
                  {course.description && <p className="ledger__desc">{course.description}</p>}
                </div>
                <div className="ledger__action">
                  {isEnrolled ? (
                    <span className="tag">Enrolled</span>
                  ) : (
                    <button
                      className="btn btn--small"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? 'Enrolling…' : 'Enroll'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
