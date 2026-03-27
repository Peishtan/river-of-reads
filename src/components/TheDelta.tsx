import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { VibeGroup, vibeLabels } from '@/data/readingData';
import { X } from 'lucide-react';

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

  if (loading) return null;
  if (tributaries.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 px-4">
      <h2 className="text-lg font-serif font-bold text-foreground tracking-wide uppercase mb-2 text-center">
        The Delta
      </h2>
      <p className="text-xs text-muted-foreground text-center max-w-xl mx-auto mb-6 leading-relaxed">
        Where your current interests fan out into the unexplored. These are the diverging paths and upcoming confluences: books that bridge your strongest streams or pull you toward new horizons.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tributaries.map((t) => (
          <div key={t.id} className="group bg-card/60 backdrop-blur-sm border border-border rounded-lg p-6 relative">
            {session && (
              <button
                onClick={() => dismiss(t.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-2 mb-2">
              {t.source_streams.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStreamColor(t.source_streams[0]) }} />
              )}
              <h3 className="text-sm font-bold font-serif text-foreground uppercase tracking-wider">Suggested Read</h3>
            </div>
            <p className="text-sm font-medium text-foreground">{t.title}</p>
            {t.author && (
              <p className="text-xs text-muted-foreground mt-0.5">{t.author}</p>
            )}
            {t.reason && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">{t.reason}</p>
            )}
            {t.source_streams.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {t.source_streams.map((stream) => (
                  <span
                    key={stream}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${getStreamColor(stream)}20`,
                      color: getStreamColor(stream),
                      borderColor: `${getStreamColor(stream)}30`,
                    }}
                  >
                    {stream}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TheDelta;
