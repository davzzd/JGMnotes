import { useState } from 'react';
import { Play } from 'lucide-react';

// Shows the thumbnail first and only loads the YouTube player when asked.
export default function YouTubeEmbed({ id, title }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-well">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play ${title}`}>
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-black/15 transition group-hover:bg-black/5" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1c2330] shadow-[0_6px_20px_rgba(0,0,0,0.35)]">
            <Play size={20} className="ml-0.5" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
