import { useState, useMemo } from 'react';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { VibeGroup, vibeLabels, vibeHSL, VIBES } from '@/data/readingData';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StarRating from '@/components/StarRating';
import BookDetailSheet from '@/components/BookDetailSheet';
import { Search, BookOpen, ArrowUpDown } from 'lucide-react';

interface FlatBook {
  title: string;
  author: string;
  vibes: VibeGroup[];
  rating: number;
  pages: number;
  dateRead?: string;
  format?: string;
  summary?: string;
  year: number;
  month: number;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type SortKey = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc' | 'title-asc';

const Library = () => {
  const { data } = useReadingData();
  const [search, setSearch] = useState('');
  const [vibeFilter, setVibeFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date-desc');
  const [selectedBook, setSelectedBook] = useState<FlatBook | null>(null);

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

  const filtered = useMemo(() => {
    let result = allBooks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      );
    }

    if (vibeFilter !== 'all') {
      result = result.filter(b => b.vibes.includes(vibeFilter as VibeGroup));
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
  }, [allBooks, search, vibeFilter, sortKey]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="text-center mb-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-1 font-serif">
          The Basin
        </h1>
        <p className="text-sm text-muted-foreground">
          {allBooks.length} books · Where the river settles
        </p>
      </header>

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

      {/* Results count */}
      <div className="w-full max-w-4xl mb-4">
        <p className="text-xs text-muted-foreground/60">
          {filtered.length === allBooks.length ? `${allBooks.length} books` : `${filtered.length} of ${allBooks.length} books`}
        </p>
      </div>

      {/* Book list */}
      <div className="w-full max-w-4xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground/60 text-sm">No books match your search.</p>
          </div>
        ) : groupedByYear ? (
          groupedByYear.map(group => (
            <div key={group.year} className="mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground/70 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/30">
                {group.year}
                <span className="text-xs font-sans font-normal text-muted-foreground/50 ml-3">{group.books.length} books</span>
              </h2>
              <div className="space-y-1">
                {group.books.map((b, i) => (
                  <BookRow key={`${b.title}-${i}`} book={b} onClick={() => setSelectedBook(b)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {filtered.map((b, i) => (
              <BookRow key={`${b.title}-${i}`} book={b} onClick={() => setSelectedBook(b)} />
            ))}
          </div>
        )}
      </div>

      <BookDetailSheet
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={open => { if (!open) setSelectedBook(null); }}
      />
    </div>
  );
};

const BookRow = ({ book, onClick }: { book: FlatBook; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-card/80 transition-colors text-left group"
  >
    {/* Date */}
    <span className="text-xs text-muted-foreground/50 w-16 flex-shrink-0 hidden sm:block">
      {monthNames[book.month]} {book.year.toString().slice(2)}
    </span>

    {/* Title & Author */}
    <div className="flex-1 min-w-0">
      <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate block">
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
