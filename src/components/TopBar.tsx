import { useState } from 'react';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import FeedbackDialog from '@/components/FeedbackDialog';

const TopBar = () => {
  const { session, signOut } = useReadingData();
  const location = useLocation();
  const isRiver = location.pathname === '/';
  const isBasin = location.pathname === '/library';
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <nav className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3 max-w-[1800px] mx-auto gap-1 sm:gap-0">
          {/* Left: nav links */}
          <div className="flex items-center gap-5">
            <a
              href="/"
              className={`text-xs tracking-[0.2em] uppercase transition-colors ${
                isRiver ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              River
            </a>
            <span className="text-border/60 text-xs">·</span>
            <a
              href="/library"
              className={`text-xs tracking-[0.2em] uppercase transition-colors ${
                isBasin ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Basin
            </a>
            {session && (
              <>
                <span className="text-border/60 text-xs">·</span>
                <a
                  href="/upload"
                  className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Import
                </a>
              </>
            )}
            <span className="text-border/60 text-xs">·</span>
            <button
              onClick={() => setFeedbackOpen(true)}
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3 h-3" />
              Feedback
            </button>
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
              <span className="text-[11px] sm:text-xs text-muted-foreground/60">
                Viewing Peishan's books ·{' '}
                <a
                  href="/auth"
                  className="text-primary/70 hover:text-primary transition-colors"
                >
                  Sign in for your own →
                </a>
              </span>
            )}
          </div>
        </div>
      </nav>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
};

export default TopBar;
