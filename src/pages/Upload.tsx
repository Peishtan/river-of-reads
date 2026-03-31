import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCSVText, parseMappedCSV, booksToMonthData, ColumnMapping } from '@/lib/parseCSV';
import { TAG_TO_VIBE } from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

type Step = 'upload' | 'mapping' | 'preview';

const UploadPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [previewStats, setPreviewStats] = useState<{ books: number; months: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const { setData } = useReadingData();
  const navigate = useNavigate();

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSVText(text);
      if (h.length === 0) {
        setError('Could not parse CSV headers.');
        return;
      }
      setHeaders(h);
      setRows(r);

      // Auto-detect columns
      const auto: Partial<ColumnMapping> = {};
      h.forEach((header, idx) => {
        const low = header.toLowerCase();
        if (low.includes('title') && auto.title === undefined) auto.title = idx;
        if ((low.includes('date read') || low === 'date') && auto.date === undefined) auto.date = idx;
        if ((low.includes('rating') || low === 'my rating') && auto.rating === undefined) auto.rating = idx;
        if ((low.includes('vibe') || low.includes('genre') || low.includes('shelf') || low.includes('tag')) && auto.vibes === undefined) auto.vibes = idx;
        if (low.includes('author') && auto.author === undefined) auto.author = idx;
      });
      setMapping(auto);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

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

  const handleConfirmMapping = () => {
    if (mapping.title === undefined || mapping.date === undefined ||
        mapping.rating === undefined || mapping.vibes === undefined) {
      setError('Please map all required columns (Title, Date, Rating, Vibes).');
      return;
    }
    setError(null);

    const parsed = parseMappedCSV(rows, mapping as ColumnMapping);
    if (parsed.length === 0) {
      setError('No valid books found. Check your column mappings and date format.');
      return;
    }

    const monthData = booksToMonthData(parsed);
    const totalBooks = monthData.reduce((a, m) => a + m.books.length, 0);
    setPreviewStats({ books: totalBooks, months: monthData.length });
    setData(monthData);
    setStep('preview');
  };

  const handleSaveToCloud = async () => {
    if (mapping.title === undefined || mapping.date === undefined) return;
    setSaving(true);

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Clear existing books for this user
      await supabase.from('books').delete().eq('user_id', userId);

      const parsed = parseMappedCSV(rows, mapping as ColumnMapping);
      // Batch insert — save RAW tags (not mapped vibes) so AI can classify them later
      const batchSize = 50;
      for (let i = 0; i < parsed.length; i += batchSize) {
        const batch = parsed.slice(i, i + batchSize).map(b => {
          const rawTags = b.rawVibes.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          return {
            title: b.title,
            author: b.author || null,
            date_read: b.dateRead.toISOString().split('T')[0],
            rating: b.rating,
            vibes: rawTags.length > 0 ? rawTags : [],
            user_id: userId,
          };
        });
        const { error: insertError } = await supabase.from('books').insert(batch);
        if (insertError) throw insertError;
      }

      // Trigger AI tag classification for unrecognized tags
      const allTags = new Set<string>();
      parsed.forEach(b => {
        b.rawVibes.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(t => allTags.add(t));
      });
      const unknownTags = [...allTags].filter(t => !TAG_TO_VIBE[t]);
      if (unknownTags.length > 0) {
        try {
          await supabase.functions.invoke('classify-tags', { body: { tags: unknownTags } });
          toast({ title: 'Tags classified', description: `${unknownTags.length} new tags were auto-mapped to streams by AI.` });
        } catch (err) {
          console.warn('Tag classification failed (non-blocking):', err);
        }
      }

      toast({ title: 'Saved!', description: `${parsed.length} books saved to Lovable Cloud.` });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Save failed', description: 'Could not save to cloud. Data is still loaded locally.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const ColumnSelect = ({ label, field }: { label: string; field: keyof ColumnMapping }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      <Select
        value={mapping[field]?.toString() ?? ''}
        onValueChange={(val) => setMapping(prev => ({ ...prev, [field]: parseInt(val) }))}
      >
        <SelectTrigger className="bg-secondary border-border text-sm">
          <SelectValue placeholder="Select column..." />
        </SelectTrigger>
        <SelectContent>
          {headers.map((h, i) => (
            <SelectItem key={i} value={i.toString()}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-2 font-serif text-center">
          Import Your River
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8 font-sans">
          Upload your reading CSV to see your personal reading river
        </p>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <>
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
                  <p className="text-foreground font-medium mb-1">Drop your reading CSV here</p>
                  <p className="text-xs text-muted-foreground">or click to browse · any CSV with book data</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 italic">⚠ Importing will replace all your existing data, not append to it.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-card border border-border text-left">
              <h3 className="text-sm font-semibold text-foreground mb-2">📋 Required CSV fields</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li><strong className="text-foreground">Title</strong> — book title</li>
                <li><strong className="text-foreground">Date Read</strong> — when you finished it (e.g. "March 23, 2026" or "2026-03-23")</li>
                <li><strong className="text-foreground">Rating</strong> — 1–5 star rating</li>
                <li><strong className="text-foreground">Category / Tags</strong> — comma-separated tags per book (e.g. "history, memoir")</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                An optional <strong className="text-foreground">Author</strong> column is also supported.
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How categories work:</strong> Tags are mapped into 5 river tributaries —
                  <em> Nature & Ocean, History & World, Ideas & Tech, Escapist & Adventure,</em> and <em>Life & Reflective</em>.
                  A book can belong to multiple categories. <strong>Unrecognized tags are automatically classified by AI</strong> into
                  the best-fitting stream — so you can use your own tags and they'll be mapped intelligently.
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                  Pre-mapped tags: nature, travel, history, culture, politics, memoir, business, future, science, technology, psychology, adventure, mystery, thriller, dystopian, reflective, literary, warm, hope, food, craft, and more. Any others are AI-classified on first upload.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Skip — use demo data instead
              </button>
            </div>
          </>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="text-foreground font-serif font-bold mb-1">Map Your Columns</h3>
              <p className="text-xs text-muted-foreground mb-4">
                We detected {headers.length} columns and {rows.length} rows. Map the fields below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColumnSelect label="📖 Title *" field="title" />
                <ColumnSelect label="📅 Date Read *" field="date" />
                <ColumnSelect label="⭐ Rating *" field="rating" />
                <ColumnSelect label="🏷️ Vibes / Genre *" field="vibes" />
                <ColumnSelect label="✍️ Author (optional)" field="author" />
              </div>
            </div>

            {/* Preview first 3 rows */}
            <div className="p-4 rounded-lg bg-card border border-border">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Preview (first 3 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {headers.map((h, i) => (
                        <th key={i} className="text-left py-1 px-2 text-muted-foreground font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri} className="border-b border-border/50">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-1 px-2 text-foreground/70 max-w-[150px] truncate whitespace-nowrap">
                            {cell.replace(/"/g, '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('upload'); setHeaders([]); setRows([]); setMapping({}); }}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirmMapping}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Parse & Preview →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Save */}
        {step === 'preview' && previewStats && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-foreground font-serif font-bold">Data loaded</h3>
                <span className="text-xs text-muted-foreground">{previewStats.months} months</span>
              </div>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{previewStats.books}</strong> books parsed</span>
                <span><strong className="text-foreground">{previewStats.months}</strong> active months</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveToCloud}
                disabled={saving}
                className="flex-1 py-3 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
                title="This will replace all your existing saved books with the new import"
              >
                {saving ? 'Saving...' : '☁️ Save to Cloud (overwrites)'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                View Your River →
              </button>
            </div>

            <button
              onClick={() => { setStep('mapping'); setPreviewStats(null); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 text-center"
            >
              ← Re-map columns
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
