import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

export default function UploadLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/courses/${id}/lessons`, { title, content });
      navigate(`/teacher/courses/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not upload lesson.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container--narrow">
      <h1>New lesson</h1>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Lesson title</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="content">Content</label>
          <textarea id="content" rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Upload lesson'}
        </button>
      </form>
    </div>
  );
}
