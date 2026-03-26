import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseGoodreadsCSV } from '@/lib/parseGoodreadsCSV';
import { useReadingData } from '@/contexts/ReadingDataContext';

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ books: number; months: number } | null>(null);
  const { setData } = useReadingData();
  const navigate = useNavigate();

  const processFile = useCallback((file: File) => {
    setError(null);
    setPreview(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file exported from Goodreads.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseGoodreadsCSV(text);
        if (parsed.length === 0) {
          setError('No readable data found. Make sure this is a Goodreads CSV export with a "Title" column.');
          return;
        }
        const totalBooks = parsed.reduce((a, m) => a + m.books.length, 0);
        setPreview({ books: totalBooks, months: parsed.length });
        setData(parsed);
      } catch (err) {
        setError('Failed to parse CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [setData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="min-h-screen bg-[#0B1215] flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-2 font-serif text-center">
          Import Your River
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 font-sans">
          Upload your Goodreads CSV export to see your personal reading river
        </p>

        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${dragOver
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-muted-foreground/40'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">Drop your Goodreads CSV here</p>
              <p className="text-xs text-muted-foreground">or click to browse · goodreads_library_export.csv</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {preview && (
          <div className="mt-6 space-y-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-foreground font-serif font-bold">Data loaded</h3>
                <span className="text-xs text-muted-foreground">{preview.months} months</span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{preview.books}</strong> books parsed</span>
                <span><strong className="text-foreground">{preview.months}</strong> active months</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              View Your River →
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">How to export from Goodreads:</p>
          <ol className="text-xs text-muted-foreground/70 space-y-1 text-left max-w-sm mx-auto">
            <li>1. Go to goodreads.com → My Books</li>
            <li>2. Click "Import and export" (left sidebar)</li>
            <li>3. Click "Export Library"</li>
            <li>4. Upload the downloaded CSV here</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Skip — use demo data instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
