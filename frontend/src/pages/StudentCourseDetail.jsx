import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import api from '../api/client';

export default function StudentCourseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/courses/student/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load this course.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container"><p className="loading">Loading…</p></div>;
  if (error) return <div className="container"><div className="alert alert--error">{error}</div></div>;

  const { course, lessons } = data;

  return (
    <div className="container">
      <h1>{course.title}</h1>
      {course.description && <p style={{ color: 'var(--ink-soft)' }}>{course.description}</p>}

      <h2 style={{ marginTop: 'var(--space-4)' }}>Lessons</h2>
      {lessons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon"><BookOpen size={24} /></div>
          <h3>No lessons have been uploaded yet.</h3>
          <p>Check back once your teacher adds course material.</p>
        </div>
      ) : (
        lessons.map((lesson, i) => (
          <div className="card lesson-card" key={lesson.id}>
            <span className="lesson-card__badge">{i + 1}</span>
            <div>
              <h3 style={{ marginBottom: 6 }}>{lesson.title}</h3>
              {lesson.content && <p style={{ margin: 0 }}>{lesson.content}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
