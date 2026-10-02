import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import Cover from '../components/Cover';
import NoteCard from '../components/NoteCard';
import { useNotes } from '../lib/api';
import { MONTHS, applyFilters, facets, formatDate, readFilters } from '../lib/filters';

const MAX_TAGS = 12;
// A line of plain text choices; scrolls sideways on phones rather than wrapping.
const ROW = 'fade-x no-scrollbar -mx-4 flex gap-x-5 gap-y-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 sm:[mask-image:none]';

function Choice({ active, children, ...props }) {
  return (
    <button className={`textlink py-1 ${active ? 'textlink-active' : ''}`} {...props}>
      {children}
    </button>
  );
}

const GRID = 'grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3';

// The newest note, shown large above the grid.
function Featured({ note }) {
  return (
    <Link to={`/notes/${note.id}`} className="surface lift group mb-3 grid overflow-hidden sm:mb-6 md:grid-cols-[1.45fr_1fr]">
      <Cover note={note} large className="aspect-video md:h-full" />
      <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-accent">Latest message · {formatDate(note.sermon_date)}</p>
        <h2 className="mt-2 font-serif text-[30px] font-medium leading-[1.1] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-[40px]">
          {note.title}
        </h2>
        {note.main_verse && <p className="mt-2 font-serif text-xl italic text-ink2">{note.main_verse}</p>}
        {note.description && <p className="mt-4 line-clamp-3 leading-relaxed text-ink2">{note.description}</p>}
        <span className="btn-primary mt-6 self-start">
          {note.files.length ? 'Read the notes' : 'Open'}
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default function NotesList() {
  const { notes, loading, error } = useNotes();
  const [params, setParams] = useSearchParams();
  const { y, m, tag } = readFilters(params);
  // The box is driven by local state so fast typing never waits on the router; the URL follows.
  const [q, setQ] = useState(() => readFilters(params).q);

  const set = (changes) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  };

  const search = (value) => {
    setQ(value);
    set({ q: value });
  };

  const clearAll = () => {
    setQ('');
    setParams({}, { replace: true });
  };

  const { years, months, tags } = useMemo(() => facets(notes, y), [notes, y]);
  const matches = useMemo(() => applyFilters(notes, { q, y, m, tag }), [notes, q, y, m, tag]);
  const filtered = Boolean(q || y || tag);
  // With no filters on, the newest note is shown large and left out of the grid.
  const featured = !filtered ? matches[0] : null;
  const rest = featured ? matches.slice(1) : matches;

  // Keep an active tag visible even when it is outside the most common ones.
  const shownTags = tags.slice(0, MAX_TAGS);
  if (tag && !shownTags.includes(tag)) shownTags.push(tag);

  return (
    <>
      <section className="pb-7 pt-6 sm:pb-10 sm:pt-10">
        <h1 className="font-serif text-[44px] font-medium leading-none tracking-tight text-ink sm:text-7xl">
          Sermon Notes
        </h1>

        <label className="well mt-7 flex max-w-xl items-center gap-3 pl-4 pr-2 sm:mt-10">
          <Search size={18} className="shrink-0 text-ink3" />
          <input
            type="search"
            value={q}
            onChange={(e) => search(e.target.value)}
            placeholder="Search by title, verse or tag"
            aria-label="Search sermon notes"
            className="field !px-0 !text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button onClick={() => search('')} className="btn-ghost !rounded-full !p-2" aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </label>

        {years.length > 0 && (
          <div className="mt-5 space-y-1.5 text-[15px] font-medium sm:mt-6">
            <div className={ROW}>
              <Choice active={!y} onClick={() => set({ y: '', m: '' })}>
                All years
              </Choice>
              {years.map((year) => (
                <Choice key={year} active={year === y} onClick={() => set({ y: year === y ? '' : year, m: '' })}>
                  {year}
                </Choice>
              ))}
            </div>

            {y && months.length > 0 && (
              <div className={ROW}>
                <Choice active={!m} onClick={() => set({ m: '' })}>
                  All months
                </Choice>
                {months.map((month) => (
                  <Choice key={month} active={month === m} onClick={() => set({ m: month === m ? '' : month })}>
                    {MONTHS[month - 1]}
                  </Choice>
                ))}
              </div>
            )}

            {shownTags.length > 0 && (
              <div className={`${ROW} !gap-x-4 font-normal`}>
                {shownTags.map((t) => (
                  <Choice key={t} active={t === tag} onClick={() => set({ tag: t === tag ? '' : t })}>
                    #{t}
                  </Choice>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {loading && (
        <div className={GRID}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface flex gap-3.5 overflow-hidden p-3 sm:flex-col sm:gap-0 sm:p-0">
              <div className="skeleton aspect-[4/3] w-[108px] shrink-0 sm:aspect-video sm:w-full sm:!rounded-none" />
              <div className="flex-1 space-y-3 py-1 sm:p-5">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-5 w-4/5" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div>
          <p className="font-serif text-2xl text-ink">The notes could not be loaded</p>
          <p className="mt-2 text-ink2">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {filtered && (
            <p className="mb-5 text-[15px] text-ink2">
              {matches.length} {matches.length === 1 ? 'note' : 'notes'}
              {tag && (
                <>
                  {' '}tagged <span className="font-semibold text-ink">#{tag}</span>
                </>
              )}
              {y && (
                <>
                  {' '}from{' '}
                  <span className="font-semibold text-ink">
                    {m ? `${MONTHS[m - 1]} ` : ''}
                    {y}
                  </span>
                </>
              )}
              {q && (
                <>
                  {' '}matching <span className="font-semibold text-ink">“{q}”</span>
                </>
              )}
              <span className="mx-2 text-ink3">·</span>
              <button onClick={clearAll} className="textlink !text-accent hover:underline">
                Show all notes
              </button>
            </p>
          )}

          {matches.length === 0 && (
            <div>
              <p className="font-serif text-2xl text-ink">{notes.length ? 'No notes match' : 'No notes yet'}</p>
              <p className="mt-2 text-ink2">
                {notes.length ? 'Try a different search, or clear the filters.' : 'Notes will appear here once they are published.'}
              </p>
            </div>
          )}

          {featured && <Featured note={featured} />}

          <div className={GRID}>
            {rest.map((note) => (
              <NoteCard key={note.id} note={note} activeTag={tag} onTag={(t) => set({ tag: t === tag ? '' : t })} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
