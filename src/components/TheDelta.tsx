import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { X, GitBranch } from 'lucide-react';

interface Tributary {
  id: string;
  title: string;
  author: string | null;
  source_streams: string[];
  reason: string | null;
  dismissed: boolean;
  created_at: string;
}

const TheDelta = () => {
  const { session } = useReadingData();
  const [tributaries, setTributaries] = useState<Tributary[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return null;
  if (tributaries.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4">
      <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-primary/70" />
          <h2 className="text-lg font-serif font-bold text-foreground">The Delta</h2>
          <span className="text-xs text-muted-foreground/60 ml-1">Incoming Tributaries</span>
        </div>

        <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed">
          Books discovered at the intersection of your most active streams — found before they've joined the river.
        </p>

        <div className="space-y-3">
          {tributaries.map((t) => (
            <div
              key={t.id}
              className="group relative bg-background/50 border border-border/50 rounded-md px-4 py-3 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.title}
                  </p>
                  {t.author && (
                    <p className="text-xs text-muted-foreground mt-0.5">{t.author}</p>
                  )}
                  {t.reason && (
                    <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed italic">
                      {t.reason}
                    </p>
                  )}
                  {t.source_streams.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {t.source_streams.map((stream) => (
                        <span
                          key={stream}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/15"
                        >
                          {stream}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {session && (
                  <button
                    onClick={() => dismiss(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TheDelta;
