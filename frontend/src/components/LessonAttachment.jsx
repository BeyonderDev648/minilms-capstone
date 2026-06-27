import { ExternalLink } from 'lucide-react';

// Pulls a YouTube video ID out of any common URL shape:
// watch?v=, youtu.be/, /embed/, /shorts/
function getYouTubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1];
    }
  } catch {
    return null;
  }
  return null;
}

function isImageUrl(url) {
  return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
}

// Renders whatever a teacher pasted as the right kind of media -
// YouTube link -> responsive video embed
// image link -> inline image
// anything else (Google Drive, a PDF, any other file host) -> a plain link
export default function LessonAttachment({ url }) {
  if (!url) return null;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) {
    return (
      <div className="lesson-embed">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isImageUrl(url)) {
    return <img src={url} alt="Lesson attachment" className="lesson-image" />;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="lesson-attachment-link">
      <ExternalLink size={13} /> View attachment
    </a>
  );
}
