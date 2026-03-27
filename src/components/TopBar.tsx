import { useReadingData } from '@/contexts/ReadingDataContext';
import { useLocation } from 'react-router-dom';

const TopBar = () => {
  const { session, signOut } = useReadingData();
  const location = useLocation();
  const isRiver = location.pathname === '/';
  const isLibrary = location.pathname === '/library';

  return (
    <nav className="w-full flex items-center justify-between px-4 py-3 max-w-[1800px] mx-auto">
      {/* Left: nav links */}
      <div className="flex items-center gap-4">
        <a
          href="/"
          className={`text-xs tracking-widest uppercase transition-colors ${
            isRiver ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          River
        </a>
        <a
          href="/library"
          className={`text-xs tracking-widest uppercase transition-colors ${
            isLibrary ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Library
        </a>
        {session && (
          <a
            href="/upload"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Import
          </a>
        )}
      </div>

      {/* Right: auth */}
      <div className="flex items-center gap-3">
        {session ? (
          <button
            onClick={signOut}
            className="text-xs text-muted-foreground/70 hover:text-destructive transition-colors"
          >
            Sign out
          </button>
        ) : (
          <a
            href="/auth"
            className="text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
};

export default TopBar;
