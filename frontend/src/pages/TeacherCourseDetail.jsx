import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Check, X } from 'lucide-react';
import api from '../api/client';
import LessonAttachment from '../components/LessonAttachment';

export default function TeacherCourseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);

  const load = useCallback(() => {
    api
      .get(`/courses/teacher/${id}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load this course.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (enrollmentId, action) => {
    setDecidingId(enrollmentId);
    setError('');
    try {
      await api.post(`/courses/${id}/requests/${enrollmentId}/${action}`);
      // Re-fetch so the request moves out of "pending" and, if approved,
      // into the enrolled students list - simplest way to keep both lists consistent.
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this request.');
      setDecidingId(null);
    }
  };

  if (loading) return <div className="container"><p className="loading">Loading…</p></div>;
  if (error && !data) return <div className="container"><div className="alert alert--error">{error}</div></div>;

  const { course, lessons, students, pendingRequests } = data;

  return (
    <div className="container">
      <h1>{course.title}</h1>
      {course.description && <p style={{ color: 'var(--ink-soft)' }}>{course.description}</p>}

      {error && <div className="alert alert--error">{error}</div>}

      <h2 style={{ marginTop: 'var(--space-4)' }}>Pending requests ({pendingRequests.length})</h2>
      {pendingRequests.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No new enrollment requests right now.</p>
      ) : (
        <div className="table-wrap" style={{ marginBottom: 'var(--space-3)' }}>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th></th></tr>
            </thead>
            <tbody>
              {pendingRequests.map((r) => (
                <tr key={r.enrollment_id}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>
                    <div className="btn-row">
                      <button
                        className="btn btn--small"
                        disabled={decidingId === r.enrollment_id}
                        onClick={() => decide(r.enrollment_id, 'approve')}
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        className="btn btn--small btn--danger"
                        disabled={decidingId === r.enrollment_id}
                        onClick={() => decide(r.enrollment_id, 'reject')}
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-head" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Lessons</h2>
        <Link to={`/teacher/courses/${id}/lessons/new`} className="btn btn--small"><Plus size={15} /> Add lesson</Link>
      </div>
      {lessons.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No lessons uploaded yet.</p>
      ) : (
        <div className="card">
          {lessons.map((lesson, i) => (
            <div key={lesson.id} className="lesson-card" style={{ marginBottom: i < lessons.length - 1 ? 'var(--space-3)' : 0 }}>
              <span className="lesson-card__badge">{i + 1}</span>
              <div className="lesson-card__body">
                <h3 style={{ marginBottom: 4 }}>{lesson.title}</h3>
                {lesson.content && <p style={{ color: 'var(--ink-soft)', margin: 0 }}>{lesson.content}</p>}
                <LessonAttachment url={lesson.attachment_url} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 'var(--space-4)' }}>Enrolled students ({students.length})</h2>
      {students.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>No students enrolled yet.</p>
      ) : (
        <div className="table-wrap">
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
        </div>
      )}
    </div>
  );
}
