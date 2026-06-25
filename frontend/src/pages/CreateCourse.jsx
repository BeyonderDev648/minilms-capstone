import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../api/client';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/courses', { title, description });
      navigate(`/teacher/courses/${data.course.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container container--narrow">
      <h1>New course</h1>
      {error && <div className="alert alert--error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" placeholder='Write a Title here...' required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" placeholder='Write a Description here...' value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          <Plus size={16} /> {loading ? 'Creating…' : 'Create course'}
        </button>
      </form>
    </div>
  );
}
