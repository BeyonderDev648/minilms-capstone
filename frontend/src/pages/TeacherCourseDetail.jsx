import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

export default function TeacherCourseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/courses/teacher/${id}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load this course.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container"><p className="loading">Loading…</p></div>;
  if (error) return <div className="container"><div className="alert alert--error">{error}</div></div>;

  const { course, lessons, students } = data;

  return (
    <div className="container">
      <h1>{course.title}</h1>
      {course.description && <p style={{ color: 'var(--ink-soft)' }}>{course.description}</p>}

      <div className="section-head" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Lessons</h2>
        <Link to={`/teacher/courses/${id}/lessons/new`} className="btn btn--small">+ Add lesson</Link>
      </div>
      {lessons.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No lessons uploaded yet.</p>
      ) : (
        <div className="card">
          {lessons.map((lesson) => (
            <div key={lesson.id} style={{ marginBottom: 'var(--space-3)' }}>
              <h3 style={{ marginBottom: 4 }}>{lesson.title}</h3>
              {lesson.content && <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{lesson.content}</p>}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 'var(--space-4)' }}>Enrolled students ({students.length})</h2>
      {students.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No students enrolled yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th></tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}><td>{s.name}</td><td>{s.email}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
