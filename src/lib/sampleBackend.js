// In-memory stand-in for Supabase so the UI can be reviewed before a project exists.
// Only ever loaded in `npm run dev` when the Supabase env vars are missing.

const PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 52>>stream
BT /F1 24 Tf 72 760 Td (JGM sample sermon note) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
const sampleUrl = URL.createObjectURL(new Blob([PDF], { type: 'application/pdf' }));

let seq = 0;
const file = (label, file_name, size_bytes) => ({
  id: `f${++seq}`, label, file_name, size_bytes, storage_path: file_name, url: sampleUrl, viewUrl: sampleUrl,
});
const note = (sermon_date, title, main_verse, tags, description, files, youtube_url = 'https://www.youtube.com/watch?v=KLfouj3G_uE') => ({
  id: `sample-${++seq}`, sermon_date, title, main_verse, tags, description, files, youtube_url, published: true,
});

let notes = [
  note('2026-09-27', 'Walking in the Fullness of the Spirit', 'Galatians 5:16–25', ['holy spirit', 'discipleship'],
    'What it means to keep in step with the Spirit day by day, and how the fruit of the Spirit grows in an ordinary life.\n\nThree practices for the week: listening before speaking, choosing peace over reaction, and serving someone unseen.',
    [file('English', 'Walking in the Fullness of the Spirit.pdf', 412000), file('Malayalam', 'Walking in the Spirit (Malayalam).pdf', 455000)]),
  note('2026-09-20', 'Faith That Moves Mountains', 'Mark 11:22–24', ['faith', 'prayer'],
    'Jesus ties faith to forgiveness and to speaking. A look at why doubt is not the opposite of faith, and how to pray with expectation.',
    [file('Notes', 'Faith That Moves Mountains.pdf', 388000)], null),
  note('2026-09-06', 'The God Who Heals', 'Exodus 15:26', ['healing', 'faith'],
    'Healing as part of God’s character, not only his power. Testimonies from the congregation and a call to pray for one another.',
    [file('Notes', 'The God Who Heals.pdf', 520000)]),
  note('2026-08-23', 'A House Built on the Rock', 'Matthew 7:24–27', ['family', 'obedience'],
    'Both builders heard the same words and faced the same storm. The difference was what they did on an ordinary day.',
    [file('Notes', 'A House Built on the Rock.pdf', 301000)], null),
  note('2026-08-02', 'Grace Upon Grace', 'John 1:14–17', ['grace', 'gospel'],
    'Why grace is not a starting point we move past, but the ground we keep standing on.',
    [file('Notes', 'Grace Upon Grace.pdf', 290000), file('Slides', 'Grace Upon Grace - Slides.pptx', 2400000)]),
  note('2026-03-15', 'The Secret Place', 'Matthew 6:5–8', ['prayer', 'discipleship'],
    'Private prayer shapes public life. A practical pattern for a daily time with God.',
    [file('Notes', 'The Secret Place.pdf', 350000)], null),
  note('2025-12-21', 'Emmanuel: God With Us', 'Isaiah 7:14', ['christmas', 'gospel'],
    'The promise of presence, from Isaiah to Bethlehem to today.',
    [file('Notes', 'Emmanuel.pdf', 275000)]),
  note('2025-11-09', 'Joshua’s Generation', 'Joshua 1:1–9', ['faith', 'calling'],
    'Be strong and courageous. What it takes for a generation to enter what the last one only saw from a distance.',
    []),
];

const byDate = (a, b) => b.sermon_date.localeCompare(a.sermon_date);
let signedIn = false;

export async function listNotes({ includeDrafts = false } = {}) {
  return notes.filter((n) => includeDrafts || n.published).sort(byDate);
}

export async function saveNote(input, { keepFiles = [], addFiles = [], removeFiles = [], cover } = {}, onProgress) {
  const id = input.id || `sample-${++seq}`;
  let cover_url = input.cover_url || null;
  if (cover?.file) cover_url = URL.createObjectURL(cover.file);
  else if (cover?.remove) cover_url = null;
  const added = [];
  for (const [i, { file: f, label, position }] of addFiles.entries()) {
    for (const fraction of [0.3, 0.7, 1]) {
      await new Promise((r) => setTimeout(r, 200));
      onProgress?.(i, fraction);
    }
    const url = URL.createObjectURL(f);
    added.push({ ...file(label, f.name, f.size), url, viewUrl: url, position: position ?? 0 });
  }
  const removed = new Set(removeFiles.map((f) => f.id));
  const files = [...keepFiles.filter((f) => !removed.has(f.id)), ...added].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  notes = [...notes.filter((n) => n.id !== id), { ...input, id, files, cover_url }];
  return id;
}

export async function deleteNote(target) {
  notes = notes.filter((n) => n.id !== target.id);
}

export async function setPublished(id, published) {
  notes = notes.map((n) => (n.id === id ? { ...n, published } : n));
}

export async function getAdminState() {
  return signedIn ? 'admin' : 'out';
}

export async function signIn() {
  signedIn = true;
  return 'admin';
}

export async function signOut() {
  signedIn = false;
}
