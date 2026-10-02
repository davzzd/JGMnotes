import { useState } from 'react';
import { youtubeId } from '../lib/filters';

// Picture for a note: its uploaded cover, else the sermon's YouTube thumbnail,
// else a flat panel in the logo's blue carrying the verse.
export default function Cover({ note, large = false, className = '' }) {
  const id = youtubeId(note.youtube_url);
  const yt = (name) => id && { src: `https://i.ytimg.com/vi/${id}/${name}.jpg`, name };
  // Tried in order; large covers try the HD thumbnail first, which not every video has.
  const sources = [
    note.cover_url && { src: note.cover_url, name: 'cover' },
    large && yt('maxresdefault'),
    yt('hqdefault'),
  ].filter(Boolean);
  const [index, setIndex] = useState(0);
  const source = sources[index];
  const next = () => setIndex((i) => i + 1);

  return (
    <div className={`relative overflow-hidden bg-[#1f62ad] ${className}`}>
      {source ? (
        <img
          key={source.src}
          src={source.src}
          alt=""
          loading="lazy"
          // YouTube answers a missing thumbnail with a tiny 120px placeholder rather than an error.
          onLoad={(e) => source.name !== 'cover' && e.currentTarget.naturalWidth <= 120 && next()}
          onError={next}
          // hqdefault is 4:3 with black bars. A 16:9 box crops them on its own; the large cover and
          // the 4:3 phone thumbnail are taller than that, so there it is scaled up to push the bars out.
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${
            source.name !== 'hqdefault'
              ? 'group-hover:scale-[1.03]'
              : large
                ? 'scale-[1.34] group-hover:scale-[1.38]'
                : 'max-sm:scale-[1.34] sm:group-hover:scale-[1.03]'
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-3 text-center sm:p-6">
          <p
            className={`font-serif italic leading-tight text-white ${
              large ? 'text-3xl sm:text-4xl' : 'text-[15px] sm:text-2xl'
            }`}
          >
            {note.main_verse || 'JGM'}
          </p>
        </div>
      )}
    </div>
  );
}
