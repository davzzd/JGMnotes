import { useLayoutEffect, useRef, useState } from 'react';

// A row of choices with one raised "slider" that glides to the chosen one.
export default function Segmented({ options, value, onChange, label }) {
  const buttons = useRef(new Map());
  const [slider, setSlider] = useState(null);

  useLayoutEffect(() => {
    const el = buttons.current.get(value);
    if (!el) return;
    const measure = () => setSlider({ left: el.offsetLeft, width: el.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div role="radiogroup" aria-label={label} className="relative inline-flex shrink-0 rounded-lg bg-well p-1">
      {slider && (
        <span
          aria-hidden
          className="absolute top-1 h-[calc(100%-0.5rem)] rounded-md bg-s1 shadow-1 transition-[transform,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ width: slider.width, transform: `translateX(${slider.left - 4}px)` }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          ref={(el) => (el ? buttons.current.set(o.value, el) : buttons.current.delete(o.value))}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
            o.value === value ? 'text-ink' : 'text-ink3 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
