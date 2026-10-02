import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'notes';

const sb = createClient(URL, KEY);

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

const publicUrl = (path, options) => sb.storage.from(BUCKET).getPublicUrl(path, options).data.publicUrl;

function withUrls(note) {
  return {
    ...note,
    cover_url: note.cover_path ? publicUrl(note.cover_path) : null,
    files: (note.files || [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((f) => ({
        ...f,
        // viewUrl serves the file inline for the reader; url forces a download with the original name.
        viewUrl: publicUrl(f.storage_path),
        url: publicUrl(f.storage_path, { download: f.file_name }),
      })),
  };
}

export async function listNotes({ includeDrafts = false } = {}) {
  // Newest sermon first; two notes for the same day show the more recently added one first.
  let query = sb
    .from('sermon_notes')
    .select('*, files:note_files(*)')
    .order('sermon_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (!includeDrafts) query = query.eq('published', true);
  return check(await query).map(withUrls);
}

// supabase-js uploads report no progress, so post to the storage endpoint directly.
async function upload(path, file, onProgress) {
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        message = JSON.parse(xhr.responseText).message || message;
      } catch {
        // keep the generic message
      }
      reject(new Error(`${file.name}: ${message}`));
    };
    xhr.onerror = () => reject(new Error(`${file.name}: network error during upload`));
    xhr.send(file);
  });
}

// cover: { file } to set a new image, { remove: true } to clear it, undefined to leave it alone.
export async function saveNote(note, { keepFiles = [], addFiles = [], removeFiles = [], cover } = {}, onProgress) {
  const id = note.id || crypto.randomUUID();
  const year = note.sermon_date.slice(0, 4);
  const row = {
    id,
    title: note.title,
    sermon_date: note.sermon_date,
    description: note.description || null,
    main_verse: note.main_verse || null,
    youtube_url: note.youtube_url || null,
    tags: note.tags,
    published: note.published,
  };

  // cover_path is only sent when the cover changes, so an untouched cover is never overwritten.
  if (cover?.file) {
    row.cover_path = `${year}/${id}/cover-${crypto.randomUUID()}.jpg`;
    await upload(row.cover_path, cover.file);
  } else if (cover?.remove) {
    row.cover_path = null;
  }

  check(await sb.from('sermon_notes').upsert(row));

  if (cover && note.cover_path) {
    check(await sb.storage.from(BUCKET).remove([note.cover_path]));
  }

  for (const f of keepFiles) {
    check(await sb.from('note_files').update({ label: f.label || null }).eq('id', f.id));
  }

  if (removeFiles.length) {
    check(await sb.storage.from(BUCKET).remove(removeFiles.map((f) => f.storage_path)));
    check(await sb.from('note_files').delete().in('id', removeFiles.map((f) => f.id)));
  }

  for (const [i, { file, label }] of addFiles.entries()) {
    // Storage keys must be plain ASCII; the original name is kept in the row for downloads.
    const ext = (file.name.match(/\.([A-Za-z0-9]+)$/)?.[1] || 'pdf').toLowerCase();
    const path = `${year}/${id}/${crypto.randomUUID()}.${ext}`;
    await upload(path, file, (fraction) => onProgress?.(i, fraction));
    check(
      await sb.from('note_files').insert({
        note_id: id,
        label: label || null,
        storage_path: path,
        file_name: file.name,
        size_bytes: file.size,
      }),
    );
    onProgress?.(i, 1);
  }
  return id;
}

export async function deleteNote(note) {
  const paths = note.files.map((f) => f.storage_path);
  if (note.cover_path) paths.push(note.cover_path);
  if (paths.length) check(await sb.storage.from(BUCKET).remove(paths));
  check(await sb.from('sermon_notes').delete().eq('id', note.id));
}

export async function setPublished(id, published) {
  check(await sb.from('sermon_notes').update({ published }).eq('id', id));
}

async function adminState(session) {
  if (!session) return 'out';
  const { data, error } = await sb.rpc('is_admin');
  if (error) throw new Error(error.message);
  return data ? 'admin' : 'notAdmin';
}

export async function getAdminState() {
  const { data } = await sb.auth.getSession();
  return adminState(data.session);
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return adminState(data.session);
}

export async function signOut() {
  await sb.auth.signOut();
}
