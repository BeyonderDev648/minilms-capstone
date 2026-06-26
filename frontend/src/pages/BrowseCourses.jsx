import { useEffect, useState } from 'react';
import { Check, Clock, X, Plus } from 'lucide-react';
import api from '../api/client';

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [statusByCourse, setStatusByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingId, setRequestingId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get('/courses/browse')
      .then(({ data }) => {
        setCourses(data.courses);
        setStatusByCourse(data.statusByCourse || {});
      })
      .catch(() => setError('Could not load courses.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time fetch-on-mount; a data-fetching library (React Query/SWR) is the "correct" long-term answer to this lint rule, but out of scope for this project's timeline
    load();
  }, []);

  const handleRequest = async (courseId) => {
    setRequestingId(courseId);
    setError('');
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setStatusByCourse((prev) => ({ ...prev, [courseId]: 'pending' }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your request.');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="container">
      <h2>Browse courses</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 10 }}>
        Every course currently offered. Enrolling sends a request - your teacher needs to approve it before you can see lesson content.
      </p>

      {error && <div className="alert alert--error">{error}</div>}
      {loading && <p className="loading">Loading…</p>}

      {!loading && courses.length === 0 && (
        <div className="empty-state">
          <h3>No courses have been created yet.</h3>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="catalog">
          {courses.map((course, i) => {
            const status = statusByCourse[course.id]; // undefined | 'pending' | 'approved' | 'rejected'
            return (
              <div className="course-card" key={course.id}>
                <div className="course-card__head">
                  <span className="course-card__badge">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="course-card__title">{course.title}</h3>
                    <p className="course-card__meta">Taught by {course.teacher_name}</p>
                  </div>
                </div>
                {course.description && <p className="course-card__desc">{course.description}</p>}
                <div className="course-card__foot">
                  {status === 'approved' && <span className="tag"><Check size={12} /> Enrolled</span>}
                  {status === 'pending' && <span className="tag tag--pending"><Clock size={12} /> Pending approval</span>}
                  {status === 'rejected' && <span className="tag tag--rejected"><X size={12} /> Not approved</span>}
                  {!status && (
                    <button
                      className="btn btn--small"
                      onClick={() => handleRequest(course.id)}
                      disabled={requestingId === course.id}
                    >
                      <Plus size={14} /> {requestingId === course.id ? 'Requesting…' : 'Request to enroll'}
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
