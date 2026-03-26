import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { MonthData, VibeGroup, readingData as dummyData } from '@/data/readingData';

interface ReadingDataContextType {
  data: MonthData[];
  setData: (data: MonthData[]) => void;
  isCustomData: boolean;
}

const ReadingDataContext = createContext<ReadingDataContextType>({
  data: dummyData,
  setData: () => {},
  isCustomData: false,
});

export const useReadingData = () => useContext(ReadingDataContext);

export const ReadingDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataRaw] = useState<MonthData[]>(dummyData);
  const [isCustomData, setIsCustomData] = useState(false);

  const setData = useCallback((d: MonthData[]) => {
    setDataRaw(d);
    setIsCustomData(true);
  }, []);

  return (
    <ReadingDataContext.Provider value={{ data, setData, isCustomData }}>
      {children}
    </ReadingDataContext.Provider>
  );
};
