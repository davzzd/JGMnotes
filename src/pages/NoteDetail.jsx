import { Suspense, lazy, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ExternalLink, Share2 } from 'lucide-react';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { useNotes } from '../lib/api';
import { formatDate, formatSize, isPdf, youtubeId } from '../lib/filters';

// pdf.js is large; only fetch it when a note with a PDF is opened.
const PdfReader = lazy(() => import('../components/PdfReader'));

const HEADING = 'mb-2 text-[15px] font-semibold text-ink';
const ACTION = 'textlink !text-accent hover:underline';

function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // share sheet dismissed or clipboard blocked
    }
  };

  return (
    <button onClick={share} className="btn-soft">
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

function ReaderFallback() {
  return <div className="skeleton !rounded-sm" style={{ aspectRatio: '1 / 1.414' }} />;
}

export default function NoteDetail() {
  const { id } = useParams();
  const { notes, loading, error } = useNotes();
  const note = notes.find((n) => n.id === id);

  const back = (
    <Link to="/" className="textlink mt-2 inline-block text-[15px] font-medium sm:mt-4">
      ← All notes
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-5 pt-16">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <>
        {back}
        <div className="mt-10">
          <p className="font-serif text-3xl text-ink">{error ? 'The note could not be loaded' : 'Note not found'}</p>
          <p className="mt-2 text-ink2">{error || 'It may have been removed or is not published yet.'}</p>
        </div>
      </>
    );
  }

  const videoId = youtubeId(note.youtube_url);
  const pdfs = note.files.filter(isPdf);

  // Video, summary and downloads. Beside the reader on wide screens, below it on phones.
  const about = (
    <div className="space-y-8">
      {videoId && (
        <div>
          <h2 className={HEADING}>Watch on YouTube</h2>
          <YouTubeEmbed id={videoId} title={note.title} />
        </div>
      )}

      {note.description && (
        <div>
          <h2 className={HEADING}>About this message</h2>
          <p className="whitespace-pre-line text-[16px] leading-[1.7] text-ink2">{note.description}</p>
        </div>
      )}

      {note.files.length > 0 && (
        <div>
          <h2 className={HEADING}>Files</h2>
          <ul className="space-y-2.5">
            {note.files.map((f) => (
              <li key={f.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-ink2">{f.label || f.file_name}</span>
                  <span className="block truncate text-sm text-ink3">
                    {[f.label && f.file_name, formatSize(f.size_bytes)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <a href={f.url} download={f.file_name} className={`${ACTION} font-medium`}>
                  Download
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ShareButton title={note.title} />
        {note.youtube_url && (
          <a href={note.youtube_url} target="_blank" rel="noreferrer" className="btn-ghost">
            <ExternalLink size={16} /> YouTube
          </a>
        )}
      </div>
    </div>
  );

  return (
    <article>
      {back}

      <header className="mt-5 max-w-3xl sm:mt-8">
        <p className="text-[15px] text-ink3">{formatDate(note.sermon_date)}</p>
        <h1 className="mt-1.5 font-serif text-[36px] font-medium leading-[1.08] tracking-tight text-ink sm:text-6xl">
          {note.title}
        </h1>
        {note.main_verse && (
          <p className="mt-3 font-serif text-xl italic text-ink2 sm:text-2xl">{note.main_verse}</p>
        )}

        {(note.tags.length > 0 || (videoId && pdfs.length > 0)) && (
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[15px]">
            {note.tags.map((t) => (
              <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="textlink hover:!text-accent">
                #{t}
              </Link>
            ))}
            {/* On phones the video sits below the notes, so offer a way down to it. */}
            {videoId && pdfs.length > 0 && (
              <a href="#about" className={`${ACTION} font-medium lg:hidden`}>
                Watch the message ↓
              </a>
            )}
          </p>
        )}
      </header>

      {pdfs.length > 0 ? (
        <div className="mt-7 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
          <section id="notes">
            <Suspense fallback={<ReaderFallback />}>
              <PdfReader key={note.id} files={pdfs} />
            </Suspense>
          </section>
          <aside
            id="about"
            className="no-scrollbar mt-12 scroll-mt-4 lg:sticky lg:top-6 lg:mt-0 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
          >
            {about}
          </aside>
        </div>
      ) : (
        <div className="mt-10 max-w-2xl">{about}</div>
      )}
    </article>
  );
}
