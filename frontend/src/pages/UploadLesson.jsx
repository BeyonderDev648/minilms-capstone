import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import api from '../api/client';
import LessonAttachment from '../components/LessonAttachment';

export default function UploadLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/courses/${id}/lessons`, { title, content, attachment_url: attachmentUrl });
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
          <input id="title" placeholder='Write Lesson Title' required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="content">Content</label>
          <textarea id="content" placeholder='Write Lesson Content' rows={8} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="attachment">Video, image, or file link (optional)</label>
          <input
            id="attachment"
            type="url"
            placeholder="https://youtube.com/watch?v=... or any link"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: 6, marginBottom: 0 }}>
            YouTube links embed as video, image links (.png/.jpg/etc) show inline, anything else (Google Drive, a PDF, etc.) shows as a link.
          </p>
        </div>

        {attachmentUrl.trim() && (
          <div className="field">
            <label>Preview</label>
            <LessonAttachment url={attachmentUrl.trim()} />
          </div>
        )}

        <button className="btn" type="submit" disabled={loading}>
          <Upload size={16} /> {loading ? 'Uploading…' : 'Upload lesson'}
        </button>
      </form>
    </div>
  );
}
