import { languagesOf } from '../lib/filters';

// Small badges saying which languages the notes come in.
export default function Languages({ note, className = '' }) {
  const langs = languagesOf(note);
  if (!langs.length) return null;
  return (
    <p className={`flex flex-wrap gap-1.5 ${className}`}>
      {langs.map((l) => (
        <span key={l} className="rounded bg-s3 px-1.5 py-0.5 text-xs font-medium text-ink2">
          {l}
        </span>
      ))}
    </p>
  );
}
