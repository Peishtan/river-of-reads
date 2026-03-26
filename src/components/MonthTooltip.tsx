import { MonthData, genreLabels, Genre } from '@/data/readingData';
import StarRating from './StarRating';

interface MonthTooltipProps {
  data: MonthData;
  x: number;
  y: number;
}

const genreDotClass: Record<Genre, string> = {
  fiction: 'bg-river-fiction',
  nonfiction: 'bg-river-nonfiction',
  scifi: 'bg-river-scifi',
  poetry: 'bg-river-poetry',
  history: 'bg-river-history',
};

const MonthTooltip = ({ data, x, y }: MonthTooltipProps) => {
  return (
    <div
      className="absolute z-50 pointer-events-none animate-topo-fade"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -110%)',
      }}
    >
      <div className="bg-card border border-border rounded-lg shadow-xl px-5 py-4 min-w-[240px]">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-lg font-bold font-serif text-foreground">{data.month}</h3>
          <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            {data.totalPages.toLocaleString()} pp
          </span>
        </div>
        <div className="space-y-2">
          {data.books.map((book, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${genreDotClass[book.genre]}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{book.title}</div>
                <div className="text-xs text-muted-foreground">{book.author} · {genreLabels[book.genre]}</div>
              </div>
              <StarRating rating={book.rating} size={11} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthTooltip;
