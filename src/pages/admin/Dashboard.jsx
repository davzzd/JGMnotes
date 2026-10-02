import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Paperclip, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { deleteNote, invalidateNotes, setPublished, signOut, useNotes } from '../../lib/api';
import { applyFilters, formatDate } from '../../lib/filters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { notes, loading, error, reload } = useNotes({ includeDrafts: true });
  const [q, setQ] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);
  const [failure, setFailure] = useState('');

  const run = async (id, action) => {
    setBusy(id);
    setFailure('');
    try {
      await action();
      invalidateNotes();
      await reload();
    } catch (err) {
      setFailure(err.message);
    }
    setBusy(null);
    setConfirming(null);
  };

  const shown = applyFilters(notes, { q, y: null, m: null, tag: '' });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-12">
        <div>
          <h1 className="font-serif text-4xl font-medium text-ink">Notes</h1>
          <p className="mt-1 text-sm text-ink2">
            {notes.length} total · {notes.filter((n) => !n.published).length} draft
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="btn-ghost">
            <ExternalLink size={16} /> View site
          </Link>
          <button className="btn-ghost" onClick={() => signOut().then(() => navigate('/admin/login'))}>
            <LogOut size={16} /> Sign out
          </button>
          <Link to="/admin/new" className="btn-primary">
            <Plus size={17} /> New note
          </Link>
        </div>
      </div>

      <label className="well mb-5 flex items-center gap-3 pl-4">
        <Search size={17} className="shrink-0 text-ink3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes"
          aria-label="Search notes"
          className="field !px-0"
        />
      </label>

      {(error || failure) && (
        <p className="mb-4 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error || failure}</p>
      )}
      {loading && <div className="skeleton h-40 !rounded-2xl" />}

      {!loading && shown.length === 0 && (
        <div className="surface px-8 py-14 text-center">
          <p className="font-serif text-2xl text-ink">{notes.length ? 'No notes match' : 'No notes yet'}</p>
          {!notes.length && <p className="mt-2 text-sm text-ink2">Add the first one with “New note”.</p>}
        </div>
      )}

      <div className="space-y-2.5">
        {shown.map((note) => (
          <div
            key={note.id}
            className={`surface flex flex-wrap items-center gap-x-4 gap-y-3 p-4 ${busy === note.id ? 'opacity-60' : ''}`}
          >
            <div className="min-w-0 flex-1 basis-64">
              <p className="truncate font-serif text-lg font-medium text-ink">{note.title}</p>
              <p className="mt-0.5 flex items-center gap-3 text-xs text-ink3">
                {formatDate(note.sermon_date)}
                <span className="flex items-center gap-1">
                  <Paperclip size={12} /> {note.files.length}
                </span>
              </p>
            </div>

            <button
              disabled={busy === note.id}
              onClick={() => run(note.id, () => setPublished(note.id, !note.published))}
              title={note.published ? 'Click to unpublish' : 'Click to publish'}
              className={`pill !py-1 !text-xs ${note.published ? 'pill-active' : 'bg-s3'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${note.published ? 'bg-accent' : 'bg-ink3'}`} />
              {note.published ? 'Published' : 'Draft'}
            </button>

            {confirming === note.id ? (
              <div className="flex items-center gap-1.5">
                <button className="btn-ghost !px-3 !py-2" onClick={() => setConfirming(null)}>
                  Cancel
                </button>
                <button
                  disabled={busy === note.id}
                  className="btn !bg-danger-soft !px-3 !py-2 text-danger"
                  onClick={() => run(note.id, () => deleteNote(note))}
                >
                  Delete note and files
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link to={`/admin/${note.id}/edit`} className="btn-ghost !p-2.5" aria-label={`Edit ${note.title}`}>
                  <Pencil size={16} />
                </Link>
                <button
                  className="btn-ghost !p-2.5 hover:!bg-danger-soft hover:!text-danger"
                  onClick={() => setConfirming(note.id)}
                  aria-label={`Delete ${note.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
