import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { VibeGroup, vibeLabels } from '@/data/readingData';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Tributary {
  id: string;
  title: string;
  author: string | null;
  source_streams: string[];
  reason: string | null;
  dismissed: boolean;
  created_at: string;
}

// Map display stream names back to vibe keys for color lookup
const STREAM_TO_VIBE: Record<string, VibeGroup> = {};
for (const [key, label] of Object.entries(vibeLabels)) {
  STREAM_TO_VIBE[label] = key as VibeGroup;
}

const TheDelta = () => {
  const { session, riverColors } = useReadingData();
  const [tributaries, setTributaries] = useState<Tributary[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [libbyUrl, setLibbyUrl] = useState<string | null>(null);
  const [libbyModalOpen, setLibbyModalOpen] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const fetchTributaries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tributaries')
        .select('*')
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.warn('Could not load tributaries:', error);
        return;
      }
      setTributaries(data || []);
    } catch (err) {
      console.warn('Could not load tributaries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTributaries();
  }, [fetchTributaries]);

  const dismiss = async (id: string) => {
    setTributaries(prev => prev.filter(t => t.id !== id));

    if (session) {
      await supabase
        .from('tributaries')
        .update({ dismissed: true })
        .eq('id', id);
    }
  };

  const getStreamColor = (stream: string) => {
    const vibe = STREAM_TO_VIBE[stream];
    if (!vibe) return 'hsl(var(--muted-foreground))';
    const c = riverColors[vibe];
    return c.startsWith('hsl') ? c : `hsl(${c})`;
  };

  const handleBorrow = async (tributary: Tributary) => {
    setBorrowingId(tributary.id);
    setBorrowError(null);
    try {
      const { data, error } = await supabase.functions.invoke('borrow-book', {
        body: { title: tributary.title, author: tributary.author },
      });
      if (error) throw error;
      if (data?.libby_url) {
        setLibbyUrl(data.libby_url);
        setLibbyModalOpen(true);
      } else {
        setBorrowError('No library link found for this book.');
      }
    } catch (err: any) {
      console.error('Borrow error:', err);
      setBorrowError(err?.message || 'Could not complete borrow request.');
    } finally {
      setBorrowingId(null);
    }
  };

  if (loading) return null;
  if (tributaries.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-lg font-serif font-bold text-foreground tracking-wide uppercase mb-2 text-center">
        The Delta
      </h2>
      <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto mb-6">
        Books at the confluence of your strongest streams.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tributaries.map((t) => {
          const streamColors = t.source_streams.map(s => getStreamColor(s));
          const gradientDot = streamColors.length >= 2
            ? `linear-gradient(135deg, ${streamColors[0]} 0%, ${streamColors[1]} 100%)`
            : streamColors[0] || 'hsl(var(--muted-foreground))';
          const primaryStream = t.source_streams[0] || 'Suggested Read';

          return (
            <div
              key={t.id}
              className="group relative rounded-xl px-6 pt-5 pb-6"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${streamColors[0] || 'hsl(var(--muted))'} 8%, hsl(var(--card))) 0%, hsl(var(--card) / 0.5) 100%)`,
                borderLeft: `2px solid color-mix(in srgb, ${streamColors[0] || 'hsl(var(--muted))'} 30%, transparent)`,
              }}
            >
              {session && (
                <button
                  onClick={() => dismiss(t.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-shrink-0" style={{ width: `${Math.max(10, 6 + streamColors.length * 6)}px` }}>
                  {streamColors.map((color, i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full border border-card"
                      style={{
                        backgroundColor: color,
                        marginLeft: i === 0 ? 0 : '-4px',
                        zIndex: streamColors.length - i,
                        position: 'relative',
                      }}
                    />
                  ))}
                </div>
                <h3 className="text-[11px] font-bold font-serif text-foreground uppercase tracking-widest">
                  Suggested Read
                </h3>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{t.title}</p>
              {t.author && (
                <p className="text-xs text-muted-foreground mt-1">{t.author}</p>
              )}
              {t.reason && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-3">{t.reason}</p>
              )}
            {t.source_streams.length > 0 && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {t.source_streams.map((stream) => (
                    <span
                      key={stream}
                      className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${getStreamColor(stream)} 20%, transparent)`,
                        color: `color-mix(in srgb, ${getStreamColor(stream)} 60%, white)`,
                        borderColor: `color-mix(in srgb, ${getStreamColor(stream)} 35%, transparent)`,
                      }}
                    >
                      {stream}
                    </span>
                  ))}
                </div>
              )}
              {session && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    disabled={borrowingId === t.id}
                    onClick={() => handleBorrow(t)}
                  >
                    {borrowingId === t.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Searching…
                      </>
                    ) : (
                      'Borrow'
                    )}
                  </Button>
                  {borrowError && borrowingId === null && (
                    <p className="text-[10px] text-destructive mt-1 text-center">{borrowError}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={libbyModalOpen} onOpenChange={setLibbyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Book Found</DialogTitle>
            <DialogDescription>
              This book is available to borrow through your library.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => {
                if (libbyUrl) window.open(libbyUrl, '_blank', 'noopener');
                setLibbyModalOpen(false);
              }}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Libby
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TheDelta;
