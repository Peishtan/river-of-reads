import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MonthData, VibeGroup, readingData as dummyData, defaultVibeHSL, setVibeHSL, VIBES, TAG_TO_VIBE } from '@/data/readingData';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface RiverColors extends Record<VibeGroup, string> {}

interface ReadingDataContextType {
  data: MonthData[];
  setData: (data: MonthData[]) => void;
  isCustomData: boolean;
  riverColors: RiverColors;
  setRiverColor: (vibe: VibeGroup, color: string) => void;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const ReadingDataContext = createContext<ReadingDataContextType>({
  data: dummyData,
  setData: () => {},
  isCustomData: false,
  riverColors: { ...defaultVibeHSL },
  setRiverColor: () => {},
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useReadingData = () => useContext(ReadingDataContext);

export const ReadingDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataRaw] = useState<MonthData[]>(dummyData);
  const [isCustomData, setIsCustomData] = useState(false);
  const [riverColors, setRiverColors] = useState<RiverColors>({ ...defaultVibeHSL });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load books from DB (works for both authenticated and anonymous users)
  useEffect(() => {
    const loadColors = async () => {
      if (!session) {
        setRiverColors({ ...defaultVibeHSL });
        setVibeHSL({ ...defaultVibeHSL });
        return;
      }
      try {
        const { data: settings } = await supabase
          .from('river_settings')
          .select('vibe_key, color_hsl');
        if (settings && settings.length > 0) {
          const colors = { ...defaultVibeHSL };
          settings.forEach(s => {
            if (VIBES.includes(s.vibe_key as VibeGroup)) {
              colors[s.vibe_key as VibeGroup] = s.color_hsl;
            }
          });
          setRiverColors(colors);
          setVibeHSL(colors);
        }
      } catch (err) {
        console.warn('Could not load river settings:', err);
      }
    };

    const loadBooks = async () => {
      try {
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .order('date_read', { ascending: true });
        if (books && books.length > 0) {
          const monthMap = new Map<string, MonthData['books']>();
          books.forEach(b => {
            if (!b.date_read) return;
            const d = new Date(b.date_read);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!monthMap.has(key)) monthMap.set(key, []);
            monthMap.get(key)!.push({
              title: b.title,
              author: b.author || '',
              vibes: (() => {
                const rawTags = b.vibes && b.vibes.length > 0 ? b.vibes : [];
                const mapped = new Set<VibeGroup>();
                for (const tag of rawTags) {
                  const vibe = TAG_TO_VIBE[tag.toLowerCase().trim()];
                  if (vibe) mapped.add(vibe);
                  else if (VIBES.includes(tag as VibeGroup)) mapped.add(tag as VibeGroup);
                }
                return mapped.size > 0 ? Array.from(mapped) : ['current'] as VibeGroup[];
              })(),
              rating: b.rating || 3,
              pages: 250,
              summary: b.summary || undefined,
              dateRead: b.date_read || undefined,
              format: b.format || undefined,
            });
          });
          const result: MonthData[] = [];
          monthMap.forEach((bks, key) => {
            const [y, m] = key.split('-').map(Number);
            result.push({ year: y, month: m, books: bks });
          });
          result.sort((a, b) => a.year - b.year || a.month - b.month);
          if (result.length > 0) {
            setDataRaw(result);
            setIsCustomData(true);
          }
        } else {
          // Fallback to demo data if DB is empty
          setDataRaw(dummyData);
          setIsCustomData(false);
        }
      } catch (err) {
        console.warn('Could not load books:', err);
        setDataRaw(dummyData);
        setIsCustomData(false);
      }
    };

    loadColors();
    loadBooks();
  }, [session]);

  const setData = useCallback((d: MonthData[]) => {
    setDataRaw(d);
    setIsCustomData(true);
  }, []);

  const setRiverColor = useCallback(async (vibe: VibeGroup, color: string) => {
    setRiverColors(prev => {
      const next = { ...prev, [vibe]: color };
      setVibeHSL(next);
      return next;
    });

    if (session) {
      try {
        // Upsert: try update first, then insert if no rows affected
        const { data: existing } = await supabase
          .from('river_settings')
          .select('id')
          .eq('vibe_key', vibe)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('river_settings')
            .update({ color_hsl: color })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('river_settings')
            .insert({ vibe_key: vibe, color_hsl: color, user_id: session.user.id });
        }
      } catch (err) {
        console.warn('Could not save river color:', err);
      }
    }
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <ReadingDataContext.Provider value={{ data, setData, isCustomData, riverColors, setRiverColor, session, loading, signOut }}>
      {children}
    </ReadingDataContext.Provider>
  );
};
