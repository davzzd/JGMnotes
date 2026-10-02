import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CoverInput from '../../components/CoverInput';
import FileDropzone from '../../components/FileDropzone';
import TagInput from '../../components/TagInput';
import { invalidateNotes, saveNote, useNotes } from '../../lib/api';
import { facets, youtubeId } from '../../lib/filters';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {hint && <span className="ml-2 font-normal text-ink3">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

let fileKey = 0;

function Form({ note, allTags }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: note?.title || '',
    sermon_date: note?.sermon_date || today(),
    main_verse: note?.main_verse || '',
    youtube_url: note?.youtube_url || '',
    description: note?.description || '',
    tags: note?.tags || [],
    published: note?.published ?? true,
  });
  // Existing files carry `saved`; newly picked ones carry `file`.
  const [items, setItems] = useState(() =>
    (note?.files || []).map((f) => ({ key: f.id, saved: f, label: f.label || '', file_name: f.file_name, size_bytes: f.size_bytes })),
  );
  const [removed, setRemoved] = useState([]);
  const [cover, setCover] = useState();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const videoId = youtubeId(form.youtube_url);

  const addFiles = (files) =>
    setItems((list) => [
      ...list,
      ...files.map((file) => ({ key: `new-${++fileKey}`, file, label: '', file_name: file.name, size_bytes: file.size })),
    ]);

  const removeFile = (key) => {
    const item = items.find((i) => i.key === key);
    if (item.saved) setRemoved((r) => [...r, item.saved]);
    setItems((list) => list.filter((i) => i.key !== key));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.youtube_url && !videoId) return setError('That does not look like a YouTube link.');
    setSaving(true);
    setError('');
    const fresh = items.filter((i) => i.file);
    try {
      await saveNote(
        { ...form, id: note?.id, cover_path: note?.cover_path, cover_url: note?.cover_url, title: form.title.trim() },
        {
          keepFiles: items.filter((i) => i.saved).map((i) => ({ ...i.saved, label: i.label.trim() })),
          addFiles: fresh.map((i) => ({ file: i.file, label: i.label.trim() })),
          removeFiles: removed,
          cover,
        },
        (index, progress) =>
          setItems((list) => list.map((i) => (i.key === fresh[index].key ? { ...i, progress } : i))),
      );
      invalidateNotes();
      navigate('/admin');
    } catch (err) {
      setError(`${err.message} — your changes may be only partly saved; check the note and try again.`);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="pb-10">
      <Link to="/admin" className="btn-ghost -ml-3 mt-8">
        <ArrowLeft size={16} /> All notes
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-medium text-ink">{note ? 'Edit note' : 'New note'}</h1>

      <div className="surface mt-7 space-y-6 p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[1fr_180px]">
          <Field id="title" label="Title">
            <div className="well">
              <input id="title" required value={form.title} onChange={update('title')} className="field" placeholder="Sermon title" />
            </div>
          </Field>
          <Field id="date" label="Date" hint={form.sermon_date > today() ? 'In the future' : ''}>
            <div className="well">
              <input id="date" type="date" required value={form.sermon_date} onChange={update('sermon_date')} className="field" />
            </div>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="verse" label="Main verse">
            <div className="well">
              <input id="verse" value={form.main_verse} onChange={update('main_verse')} className="field" placeholder="John 3:16" />
            </div>
          </Field>
          <Field id="youtube" label="YouTube link">
            <div className="well">
              <input
                id="youtube"
                type="url"
                value={form.youtube_url}
                onChange={update('youtube_url')}
                className="field"
                placeholder="https://youtu.be/…"
              />
            </div>
          </Field>
        </div>

        {videoId && (
          <div className="flex items-center gap-4 rounded-xl bg-s3 p-3">
            <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className="h-16 rounded-lg" />
            <p className="text-sm text-ink2">Check this is the right video.</p>
          </div>
        )}

        <Field id="description" label="Description">
          <div className="well">
            <textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={update('description')}
              className="field resize-y leading-relaxed"
              placeholder="A short summary of the message"
            />
          </div>
        </Field>

        <Field id="tags" label="Tags" hint="Press Enter or comma to add">
          <TagInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} suggestions={allTags} />
        </Field>

        <div>
          <p className="label">Cover image</p>
          <CoverInput currentUrl={note?.cover_url} value={cover} onChange={setCover} disabled={saving} />
        </div>

        <div>
          <p className="label">Files</p>
          <FileDropzone
            items={items}
            busy={saving}
            onAdd={addFiles}
            onRemove={removeFile}
            onLabel={(key, label) => setItems((list) => list.map((i) => (i.key === key ? { ...i, label } : i)))}
          />
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 rounded-full bg-s3 transition peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-md after:transition-transform peer-checked:after:translate-x-5" />
          {form.published ? 'Visible on the site' : 'Draft — hidden from the site'}
        </label>

        <div className="flex gap-2">
          <Link to="/admin" className="btn-ghost">
            Cancel
          </Link>
          <button disabled={saving} className="btn-primary !px-6">
            {saving ? 'Saving…' : note ? 'Save changes' : 'Publish note'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function NoteForm() {
  const { id } = useParams();
  const { notes, loading, error } = useNotes({ includeDrafts: true });

  if (loading) return <div className="skeleton mt-24 h-96 !rounded-2xl" />;

  const note = id ? notes.find((n) => n.id === id) : null;
  if (error || (id && !note)) {
    return (
      <div className="surface mt-16 px-8 py-14 text-center">
        <p className="font-serif text-2xl text-ink">{error ? 'Could not load the note' : 'Note not found'}</p>
        {error && <p className="mt-2 text-sm text-ink2">{error}</p>}
        <Link to="/admin" className="btn-soft mt-6">
          Back to notes
        </Link>
      </div>
    );
  }

  return <Form key={id || 'new'} note={note} allTags={facets(notes, null).tags} />;
}
