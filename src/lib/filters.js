export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// sermon_date is a plain 'YYYY-MM-DD'; parse by hand so timezones never shift the day.
export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

export function formatDate(s) {
  const { y, m, d } = parseDate(s);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function isPdf(file) {
  return /\.pdf$/i.test(file.file_name);
}

export function readFilters(params) {
  return {
    q: params.get('q') || '',
    y: Number(params.get('y')) || null,
    m: Number(params.get('m')) || null,
    tag: params.get('tag') || '',
  };
}

export function applyFilters(notes, { q, y, m, tag }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return notes.filter((n) => {
    const d = parseDate(n.sermon_date);
    if (y && d.y !== y) return false;
    if (y && m && d.m !== m) return false;
    if (tag && !n.tags.includes(tag)) return false;
    if (!words.length) return true;
    const hay = [n.title, n.main_verse, n.description, n.tags.join(' ')].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

// Years (newest first), months present in the selected year, and tags by frequency.
export function facets(notes, year) {
  const years = new Set();
  const months = new Set();
  const tagCount = new Map();
  for (const n of notes) {
    const d = parseDate(n.sermon_date);
    years.add(d.y);
    if (d.y === year) months.add(d.m);
    for (const t of n.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  }
  return {
    years: [...years].sort((a, b) => b - a),
    months: [...months].sort((a, b) => a - b),
    tags: [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t),
  };
}

export function youtubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|live|shorts)\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
