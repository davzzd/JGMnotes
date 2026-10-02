import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minus, Plus, X } from 'lucide-react';
// The legacy build keeps older phones (iOS 15/16, older Android) working.
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOMS = [1, 1.5, 2, 3];
const MAX_READING_WIDTH = 980;
const A4 = 1.414;

// The page a visitor last reached in each file, kept in their own browser.
const pageKey = (fileId) => `jgmnotes:page:${fileId}`;

function readSavedPage(fileId) {
  try {
    return Number(localStorage.getItem(pageKey(fileId))) || 1;
  } catch {
    return 1;
  }
}

function savePage(fileId, page) {
  try {
    if (page > 1) localStorage.setItem(pageKey(fileId), String(page));
    else localStorage.removeItem(pageKey(fileId));
  } catch {
    // storage blocked; reading simply starts from page 1 next time
  }
}

function usePdf(url) {
  const [state, setState] = useState({ url: null, pdf: null, ratio: A4, error: null });
  // Download progress from 0 to 1, or null while the size is unknown.
  const [progress, setProgress] = useState({ url: null, value: null });

  useEffect(() => {
    let cancelled = false;
    const task = pdfjs.getDocument({ url });
    task.onProgress = ({ loaded, total }) => {
      if (!cancelled && total) setProgress({ url, value: Math.min(1, loaded / total) });
    };
    task.promise
      .then(async (pdf) => {
        const viewport = (await pdf.getPage(1)).getViewport({ scale: 1 });
        if (!cancelled) setState({ url, pdf, ratio: viewport.height / viewport.width, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ url, pdf: null, ratio: A4, error: err.message || 'Unknown error' });
      });
    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [url]);

  const loaded = state.url === url ? state : { pdf: null, ratio: A4, error: null };
  return { ...loaded, progress: progress.url === url ? progress.value : null };
}

// One page. It only draws while it is near the viewport and frees its canvas when far away,
// so long documents stay within mobile memory limits.
function PdfPage({ pdf, number, width, ratio, root, onCurrent }) {
  const holder = useRef(null);
  const [near, setNear] = useState(false);
  const [pageRatio, setPageRatio] = useState(ratio);

  useEffect(() => {
    const el = holder.current;
    const nearby = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root,
      rootMargin: '150% 0px',
    });
    // A page is "current" while it crosses the middle of the viewport.
    const middle = new IntersectionObserver(([entry]) => entry.isIntersecting && onCurrent(number), {
      root,
      rootMargin: '-50% 0px -50% 0px',
    });
    nearby.observe(el);
    middle.observe(el);
    return () => {
      nearby.disconnect();
      middle.disconnect();
    };
  }, [root, number, onCurrent]);

  useEffect(() => {
    const el = holder.current;
    if (!near) {
      el.replaceChildren();
      return;
    }
    if (!width) return;

    let cancelled = false;
    let task;
    pdf
      .getPage(number)
      .then((page) => {
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        setPageRatio(base.height / base.width);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (width / base.width) * dpr });
        // Draw on a fresh canvas and swap it in when done, so resizing never flashes blank.
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = 'block h-full w-full';
        task = page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport });
        return task.promise.then(() => {
          if (!cancelled) el.replaceChildren(canvas);
        });
      })
      .catch(() => {
        // cancelled renders reject; a page that truly fails stays as a blank sheet
      });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, number, near, width]);

  return (
    <div
      ref={holder}
      id={`pdf-page-${number}`}
      className={`overflow-hidden rounded-sm bg-white shadow-1 ${root ? 'scroll-mt-4' : 'scroll-mt-20'}`}
      style={{ aspectRatio: `1 / ${pageRatio}` }}
      role="img"
      aria-label={`Page ${number}`}
    />
  );
}

function ToolButton({ label, children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className="btn-ghost !rounded-full !p-2.5" {...props}>
      {children}
    </button>
  );
}

function Document({ file, files, onPick }) {
  const { pdf, ratio, error, progress } = usePdf(file.viewUrl);
  // Offered, never forced: the page this visitor reached last time, until they take it or read on.
  const [resume, setResume] = useState(() => readSavedPage(file.id));
  const resumeRef = useRef(resume);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [scroller, setScroller] = useState(null);
  const [avail, setAvail] = useState(0);
  const [current, setCurrent] = useState(1);
  const currentRef = useRef(1);
  const toggled = useRef(false);
  // True once the inline bar has scrolled up to its pinned position.
  const [sentinel, setSentinel] = useState(null);
  const [stuck, setStuck] = useState(false);

  const dismissResume = useCallback(() => {
    resumeRef.current = 1;
    setResume(1);
  }, []);

  const onCurrent = useCallback(
    (n) => {
      currentRef.current = n;
      setCurrent(n);
      if (n > 1) dismissResume();
      // While the offer is still showing, sitting on page 1 must not wipe the saved page.
      if (resumeRef.current === 1) savePage(file.id, n);
    },
    [file.id, dismissResume],
  );

  const continueReading = () => {
    const page = document.getElementById(`pdf-page-${resume}`);
    dismissResume();
    // Scroll after the offer has left the layout, or the page lands under the pinned bar.
    requestAnimationFrame(() => page?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  useEffect(() => {
    if (!scroller) return;
    const observer = new ResizeObserver(([entry]) => setAvail(Math.floor(entry.contentRect.width)));
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scroller]);

  useEffect(() => {
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 40),
      { rootMargin: '-14px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => e.key === 'Escape' && setExpanded(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  // Keep the reader on the same page when switching between inline and full screen.
  useEffect(() => {
    if (!toggled.current) return;
    document.getElementById(`pdf-page-${currentRef.current}`)?.scrollIntoView({ block: 'start' });
  }, [expanded]);

  const toggle = () => {
    toggled.current = true;
    setZoom(0);
    setExpanded((v) => !v);
  };

  const pageWidth = expanded ? Math.min(avail, MAX_READING_WIDTH) * ZOOMS[zoom] : avail;

  return (
    <div className={expanded ? 'fixed inset-0 z-50 flex flex-col bg-canvas' : ''}>
      {!expanded && <div ref={setSentinel} />}
      {/* At rest the bar is part of the page; once pinned over the notes it becomes frosted glass. */}
      <div
        className={`z-20 flex items-center gap-1 transition-[background-color,box-shadow] duration-300 ${
          expanded
            ? 'px-2 py-2 shadow-1 backdrop-blur-xl backdrop-saturate-150 sm:px-4'
            : `sticky top-2 -mx-1 mb-3 rounded-xl px-2 py-1.5 sm:top-3 ${
                stuck ? 'shadow-2 backdrop-blur-xl backdrop-saturate-150' : ''
              }`
        }`}
        style={{ backgroundColor: expanded || stuck ? 'var(--glass)' : 'transparent' }}
      >
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-4 overflow-x-auto px-2 text-sm font-semibold">
          {files.length > 1 ? (
            files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onPick(f.id)}
                className={`textlink py-1.5 ${f.id === file.id ? 'textlink-active' : ''}`}
              >
                {f.label || f.file_name}
              </button>
            ))
          ) : (
            <span className="truncate text-ink">{file.label || 'Notes'}</span>
          )}
        </div>

        {pdf && (
          <span className="shrink-0 px-2 text-xs font-medium tabular-nums text-ink3">
            {current} / {pdf.numPages}
          </span>
        )}

        {expanded && (
          <>
            <ToolButton label="Zoom out" disabled={zoom === 0} onClick={() => setZoom((z) => z - 1)}>
              <Minus size={18} />
            </ToolButton>
            <ToolButton label="Zoom in" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => z + 1)}>
              <Plus size={18} />
            </ToolButton>
          </>
        )}

        <a href={file.url} download={file.file_name} className="btn-primary !px-3.5 !py-2">
          <Download size={16} /> Download
        </a>
        <ToolButton label={expanded ? 'Close full screen' : 'Read full screen'} onClick={toggle}>
          {expanded ? <X size={18} /> : <Maximize2 size={17} />}
        </ToolButton>
      </div>

      <div ref={setScroller} className={expanded ? 'flex-1 overflow-auto overscroll-contain px-2 py-4 sm:px-6' : ''}>
        {error && (
          <div className="rounded-lg bg-s3 px-6 py-12 text-center">
            <p className="font-serif text-xl text-ink">This file could not be shown here</p>
            <p className="mt-2 text-sm text-ink2">You can still download it and open it on your device.</p>
            <a href={file.url} download={file.file_name} className="btn-primary mt-5">
              <Download size={16} /> Download
            </a>
          </div>
        )}

        {!pdf && !error && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-sm bg-white text-sm text-[#8b8f98] shadow-1"
            style={{ aspectRatio: `1 / ${A4}` }}
            role="status"
          >
            Opening notes…
            <div className="h-1 w-40 overflow-hidden rounded-full bg-[#ece7dd]">
              <div
                className={`h-full rounded-full bg-accent transition-[width] duration-300 ${progress == null ? 'w-1/3 animate-pulse' : ''}`}
                style={progress == null ? undefined : { width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {pdf && resume > 1 && resume <= pdf.numPages && (
          <p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-accent-soft px-4 py-2.5 text-[15px] text-ink2">
            You were on page {resume}.
            <button type="button" onClick={continueReading} className="font-semibold text-accent hover:underline">
              Continue reading
            </button>
            <button type="button" onClick={dismissResume} className="ml-auto text-ink3 hover:text-ink">
              Dismiss
            </button>
          </p>
        )}

        {pdf && (
          <div className="mx-auto space-y-3 sm:space-y-4" style={{ width: pageWidth || undefined }}>
            {Array.from({ length: pdf.numPages }, (_, i) => (
              <PdfPage
                key={i}
                pdf={pdf}
                number={i + 1}
                width={pageWidth}
                ratio={ratio}
                root={expanded ? scroller : null}
                onCurrent={onCurrent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PdfReader({ files }) {
  const [activeId, setActiveId] = useState(files[0].id);
  const file = files.find((f) => f.id === activeId) || files[0];
  // Keyed by file so page position, zoom and the loaded document reset on switch.
  return <Document key={file.id} file={file} files={files} onPick={setActiveId} />;
}
