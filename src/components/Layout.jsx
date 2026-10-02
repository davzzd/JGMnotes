import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { isSample } from '../lib/api';

// Where each page was scrolled to, so Back returns to the same spot in the list.
const scrollPositions = new Map();

// New pages open at the top; Back/Forward restore the previous position. Keyed by path only,
// so changing a filter (which rewrites the query string) never moves the page.
function useScrollMemory(pathname) {
  const type = useNavigationType();

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, type === 'POP' ? scrollPositions.get(pathname) || 0 : 0);
    const save = () => scrollPositions.set(pathname, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
    // Only a change of page should move the scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage blocked; the choice just won't persist
    }
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="btn-ghost !rounded-full !p-2.5 !text-ink3 hover:!text-ink"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  useScrollMemory(pathname);
  const width = isAdmin ? 'max-w-[920px]' : 'max-w-[1120px]';

  return (
    <div className="flex min-h-screen flex-col">
      {isSample && (
        <div className="bg-accent-soft px-4 py-2 text-center text-xs font-medium text-accent">
          Sample data — Supabase is not connected yet. Nothing here is saved.
        </div>
      )}

      {/* Plain masthead: part of the page, scrolls away with it. */}
      <header className="px-4 sm:px-5">
        <div className={`mx-auto flex h-16 ${width} items-center justify-between sm:h-20`}>
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-3.5 rounded-lg" aria-label="JGM home">
            <img src="/Logo.png" alt="JGM" className="logo h-8 w-auto sm:h-9" />
            <span className="hidden text-[13px] font-medium leading-tight text-ink3 sm:block">
              Joshua Generation
              <br />
              Ministries
            </span>
            {isAdmin && (
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
                Admin
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className={`mx-auto w-full ${width} flex-1 px-4 pb-24 sm:px-5`}>
        <Outlet />
      </main>

      <footer className="pb-10 text-center text-xs text-ink3">
        Joshua Generation Ministries
      </footer>
    </div>
  );
}
