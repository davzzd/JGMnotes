import { useState } from 'react';
import { X } from 'lucide-react';

export default function TagInput({ value, onChange, suggestions }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const add = (raw) => {
    const tag = raw.trim().toLowerCase();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const typed = text.trim().toLowerCase();
  const matches = suggestions.filter((s) => !value.includes(s) && s.includes(typed)).slice(0, 8);

  return (
    <div className="relative">
      <div className="well flex flex-wrap items-center gap-1.5 px-2.5 py-2">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1.5 text-sm font-medium text-accent">
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== t))}
              className="rounded-full p-0.5 hover:bg-accent-soft"
              aria-label={`Remove ${t}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          id="tags"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            add(text);
          }}
          placeholder={value.length ? '' : 'faith, prayer, healing…'}
          className="field min-w-[140px] flex-1 !px-1.5 !py-1"
        />
      </div>

      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 flex flex-wrap gap-1.5 rounded-xl bg-s2 p-3 shadow-float">
          {matches.map((s) => (
            // onMouseDown so the pick lands before the input's blur closes the list
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className="pill bg-s3 !py-1"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
