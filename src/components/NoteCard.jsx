import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Cover from './Cover';
import { formatDate } from '../lib/filters';

// A compact row on phones (picture left), a full card with the picture on top from `sm` up.
export default function NoteCard({ note, onTag, activeTag }) {
  return (
    <article className="surface lift group relative flex gap-3.5 overflow-hidden p-3 sm:flex-col sm:gap-0 sm:p-0">
      <Cover
        note={note}
        className="aspect-[4/3] w-[108px] shrink-0 self-start rounded-lg sm:aspect-video sm:w-full sm:rounded-none"
      />

      <div className="flex min-w-0 flex-1 flex-col sm:p-5">
        <p className="text-[13px] text-ink3 sm:text-sm">{formatDate(note.sermon_date)}</p>

        <h3 className="mt-0.5 font-serif text-[19px] font-medium leading-snug text-ink sm:mt-1 sm:text-[23px]">
          {/* Stretched link: the whole card opens the note; tag buttons sit above it. */}
          <Link
            to={`/notes/${note.id}`}
            className="line-clamp-2 rounded-xl transition-colors after:absolute after:inset-0 after:rounded-xl group-hover:text-accent"
          >
            {note.title}
          </Link>
        </h3>

        {note.main_verse && (
          <p className="truncate font-serif text-[15px] italic text-ink2 sm:mt-0.5 sm:text-[17px]">{note.main_verse}</p>
        )}

        {note.description && (
          <p className="mt-2.5 hidden text-[15px] leading-relaxed text-ink2 sm:line-clamp-2">{note.description}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2 sm:pt-5">
          <p className="hidden min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm sm:flex">
            {note.tags.slice(0, 3).map((t) => (
              <button
                key={t}
                onClick={() => onTag(t)}
                className={`textlink relative z-10 hover:text-accent ${t === activeTag ? '!text-accent' : ''}`}
              >
                #{t}
              </button>
            ))}
          </p>
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent">
            {note.files.length ? 'Read notes' : 'Open'}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}
