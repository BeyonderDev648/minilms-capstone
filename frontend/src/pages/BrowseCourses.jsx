import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
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
      <h2>Browse courses</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 10 }}>Every course currently offered, across all teachers.</p>

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
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <div className="course-card" key={course.id}>
                <div className="course-card__head">
                  <span className="course-card__badge">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="course-card__title">{course.title}</h3>
                    <p className="course-card__meta">{course.teacher_name}</p>
                  </div>
                </div>
                {course.description && <p className="course-card__desc">{course.description}</p>}
                <div className="course-card__foot">
                  {isEnrolled ? (
                    <span className="tag"><Check size={12} /> Enrolled</span>
                  ) : (
                    <button
                      className="btn btn--small"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                    >
                      <Plus size={14} /> {enrollingId === course.id ? 'Enrolling…' : 'Enroll'}
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
