import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { VibeGroup, vibeLabels, vibeHSL, VIBES } from '@/data/readingData';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StarRating from '@/components/StarRating';
import BookDetailSheet from '@/components/BookDetailSheet';
import { Search, BookOpen, ArrowUpDown, Waves, Upload } from 'lucide-react';

interface FlatBook {
  title: string;
  author: string;
  vibes: VibeGroup[];
  rating: number;
  pages: number;
  dateRead?: string;
  format?: string;
  summary?: string;
  bookId?: string;
  year: number;
  month: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type SortKey = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'title-asc';
type FormatFilter = 'all' | 'fiction' | 'nonfiction';

const Library = () => {
  const { data, isCustomData, session, loading } = useReadingData();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [vibeFilter, setVibeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [selectedBook, setSelectedBook] = useState<FlatBook | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Read year/month filter from URL params (from river click-through)
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');

  const allBooks = useMemo<FlatBook[]>(() => {
    const books: FlatBook[] = [];
    data.forEach(m => {
      m.books.forEach(b => {
        books.push({
          ...b,
          year: m.year,
          month: m.month,
        });
      });
    });
    return books;
  }, [data]);

  // Apply URL-based year/month filter
  const baseFiltered = useMemo(() => {
    let result = allBooks;
    if (yearParam) {
      const y = parseInt(yearParam);
      if (monthParam !== null) {
        const m = parseInt(monthParam);
        result = result.filter(b => b.year === y && b.month === m);
      } else {
        result = result.filter(b => b.year === y);
      }
    }
    return result;
  }, [allBooks, yearParam, monthParam]);

  const filtered = useMemo(() => {
    let result = baseFiltered;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    if (vibeFilter !== 'all') {
      result = result.filter(b => b.vibes.includes(vibeFilter as VibeGroup));
    }

    if (formatFilter !== 'all') {
      result = result.filter(b => {
        const fmt = (b.format || '').toLowerCase().trim();
        if (formatFilter === 'fiction') return fmt === 'fiction';
        if (formatFilter === 'nonfiction') return fmt === 'non-fiction' || fmt === 'nonfiction' || fmt === 'memoir';
        return true;
      });
    }

    result = [...result].sort((a, b) => {
      const dateA = a.dateRead ? new Date(a.dateRead).getTime() : (a.year * 12 + a.month);
      const dateB = b.dateRead ? new Date(b.dateRead).getTime() : (b.year * 12 + b.month);
      switch (sortKey) {
        case 'date-desc': return dateB - dateA;
        case 'date-asc': return dateA - dateB;
        case 'rating-desc': return b.rating - a.rating;
        case 'rating-asc': return a.rating - b.rating;
        case 'title-asc': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

    return result;
  }, [baseFiltered, search, vibeFilter, formatFilter, sortKey]);

  // Flat list for keyboard nav
  const flatFiltered = filtered;

  // Group by year for section headers
  const groupedByYear = useMemo(() => {
    if (sortKey === 'title-asc' || sortKey === 'rating-desc' || sortKey === 'rating-asc') return null;
    const groups: { year: number; books: FlatBook[] }[] = [];
    let currentYear = -1;
    filtered.forEach(b => {
      if (b.year !== currentYear) {
        currentYear = b.year;
        groups.push({ year: b.year, books: [] });
      }
      groups[groups.length - 1].books.push(b);
    });
    return groups;
  }, [filtered, sortKey]);

  const activeVibes = useMemo(() => {
    const set = new Set<VibeGroup>();
    allBooks.forEach(b => b.vibes.forEach(v => set.add(v)));
    return VIBES.filter(v => set.has(v));
  }, [allBooks]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedBook) return; // don't nav when sheet is open
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      setFocusIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      setFocusIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0 && focusIndex < flatFiltered.length) {
      e.preventDefault();
      setSelectedBook(flatFiltered[focusIndex]);
    } else if (e.key === 'Escape') {
      setFocusIndex(-1);
    }
  }, [flatFiltered, focusIndex, selectedBook]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${focusIndex}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusIndex]);

  // Reset focus when filters change
  useEffect(() => { setFocusIndex(-1); }, [search, vibeFilter, formatFilter, sortKey]);

  const isFilteredByDate = yearParam !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground/50 text-sm">Loading…</div>
      </div>
    );
  }

  // Check if we're showing demo data (no custom data and not logged in)
  const showEmptyState = !isCustomData && !session;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-black text-primary tracking-[0.18em] uppercase mb-1 font-serif">
          The Basin
        </h1>
        <p className="text-sm text-muted-foreground">
          {isFilteredByDate
            ? `${monthParam !== null ? monthNames[parseInt(monthParam)] + ' ' : ''}${yearParam} · ${filtered.length} books`
            : `${allBooks.length} books · Where the river settles`
          }
        </p>
        {isFilteredByDate && (
          <a href="/library" className="text-xs text-primary underline underline-offset-4 hover:text-primary/80 transition-colors mt-1 inline-block">
            View all books →
          </a>
        )}
      </header>

      {showEmptyState ? (
        /* ── Empty state ───────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-20 max-w-md text-center">
          <div className="relative mb-6">
            <Waves className="w-16 h-16 text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-primary/40" />
            </div>
          </div>
          <h2 className="text-xl font-serif font-bold text-foreground/80 mb-2">Your basin is empty</h2>
          <p className="text-sm text-muted-foreground/70 leading-relaxed mb-6">
            No sediment yet — your reading history will settle here once you start flowing.
            Import a CSV of your books to see them mapped across your streams.
          </p>
          <div className="flex gap-3">
            <a
              href="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Sign in
            </a>
            <a
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Filters bar */}
          <div className="w-full max-w-4xl flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Search by title or author…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <Select value={vibeFilter} onValueChange={setVibeFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
                <SelectValue placeholder="All streams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All streams</SelectItem>
                {activeVibes.map(v => (
                  <SelectItem key={v} value={v}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vibeHSL[v] }} />
                      {vibeLabels[v]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={v => setFormatFilter(v as FormatFilter)}>
              <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="fiction">Fiction</SelectItem>
                <SelectItem value="nonfiction">Non-fiction & Memoir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="rating-desc">Highest rated</SelectItem>
                <SelectItem value="rating-asc">Lowest rated</SelectItem>
                <SelectItem value="title-asc">A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count + keyboard hint */}
          <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground/60">
              {filtered.length === allBooks.length ? `${allBooks.length} books` : `${filtered.length} of ${allBooks.length} books`}
            </p>
            <p className="text-xs text-muted-foreground/30 hidden sm:block">
              ↑↓ navigate · Enter to open
            </p>
          </div>

          {/* Book list */}
          <div className="w-full max-w-4xl" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground/60 text-sm">No books match your search.</p>
              </div>
            ) : groupedByYear ? (
              (() => {
                let globalIdx = 0;
                return groupedByYear.map(group => (
                  <div key={group.year} className="mb-8">
                    <h2 className="text-lg font-serif font-bold text-foreground/70 mb-3 sticky top-12 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/30">
                      {group.year}
                      <span className="text-xs font-sans font-normal text-muted-foreground/50 ml-3">{group.books.length} books</span>
                    </h2>
                    <div className="space-y-1">
                      {group.books.map((b, i) => {
                        const idx = globalIdx++;
                        return (
                          <BookRow
                            key={`${b.title}-${i}`}
                            book={b}
                            focused={idx === focusIndex}
                            dataIndex={idx}
                            onClick={() => setSelectedBook(b)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            ) : (
              <div className="space-y-1">
                {filtered.map((b, i) => (
                  <BookRow
                    key={`${b.title}-${i}`}
                    book={b}
                    focused={i === focusIndex}
                    dataIndex={i}
                    onClick={() => setSelectedBook(b)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <BookDetailSheet
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={open => { if (!open) setSelectedBook(null); }}
      />
    </div>
  );
};

const BookRow = ({ book, onClick, focused, dataIndex }: { book: FlatBook; onClick: () => void; focused: boolean; dataIndex: number }) => (
  <button
    onClick={onClick}
    data-index={dataIndex}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left group ${
      focused ? 'bg-card ring-1 ring-primary/40' : 'hover:bg-card/80'
    }`}
  >
    {/* Date */}
    <span className="text-xs text-muted-foreground/50 w-16 flex-shrink-0 hidden sm:block">
      {monthNames[book.month]} {book.year.toString().slice(2)}
    </span>

    {/* Title & Author */}
    <div className="flex-1 min-w-0">
      <span className={`text-sm transition-colors truncate block ${focused ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
        {book.title}
      </span>
      {book.author && (
        <span className="text-xs text-muted-foreground/60 truncate block">{book.author}</span>
      )}
    </div>

    {/* Vibe dots */}
    <div className="flex flex-shrink-0 gap-0">
      {book.vibes.map((v, i) => (
        <span
          key={v}
          className="w-2 h-2 rounded-full border border-card"
          style={{
            backgroundColor: vibeHSL[v],
            marginLeft: i === 0 ? 0 : '-2px',
            zIndex: book.vibes.length - i,
            position: 'relative',
          }}
        />
      ))}
    </div>

    {/* Rating */}
    <div className="flex-shrink-0 hidden sm:block">
      <StarRating rating={book.rating} size={10} />
    </div>
  </button>
);

export default Library;
