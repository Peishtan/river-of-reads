import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MonthData, VibeGroup, readingData as dummyData, defaultVibeHSL, setVibeHSL, VIBES } from '@/data/readingData';
import { supabase } from '@/integrations/supabase/client';

interface RiverColors extends Record<VibeGroup, string> {}

interface ReadingDataContextType {
  data: MonthData[];
  setData: (data: MonthData[]) => void;
  isCustomData: boolean;
  riverColors: RiverColors;
  setRiverColor: (vibe: VibeGroup, color: string) => void;
}

const ReadingDataContext = createContext<ReadingDataContextType>({
  data: dummyData,
  setData: () => {},
  isCustomData: false,
  riverColors: { ...defaultVibeHSL },
  setRiverColor: () => {},
});

export const useReadingData = () => useContext(ReadingDataContext);

export const ReadingDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataRaw] = useState<MonthData[]>(dummyData);
  const [isCustomData, setIsCustomData] = useState(false);
  const [riverColors, setRiverColors] = useState<RiverColors>({ ...defaultVibeHSL });

  // Load river colors from Supabase on mount
  useEffect(() => {
    const loadColors = async () => {
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

    // Load saved books from Supabase
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
              vibes: (b.vibes || []) as VibeGroup[],
              rating: b.rating || 3,
              pages: 250,
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
        }
      } catch (err) {
        console.warn('Could not load books:', err);
      }
    };

    loadColors();
    loadBooks();
  }, []);

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

    // Persist to Supabase
    try {
      await supabase
        .from('river_settings')
        .update({ color_hsl: color })
        .eq('vibe_key', vibe);
    } catch (err) {
      console.warn('Could not save river color:', err);
    }
  }, []);

  return (
    <ReadingDataContext.Provider value={{ data, setData, isCustomData, riverColors, setRiverColor }}>
      {children}
    </ReadingDataContext.Provider>
  );
};
