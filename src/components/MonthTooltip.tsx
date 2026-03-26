import { MonthData, vibeLabels, vibeHSL, totalPages, avgRating, monthLabelFull } from '@/data/readingData';
import StarRating from './StarRating';

interface MonthTooltipProps {
  data: MonthData;
}

const MonthTooltip = ({ data }: MonthTooltipProps) => {
  const avg = avgRating(data);
  const fiveStarBooks = data.books.filter(b => b.rating === 5);

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl px-4 py-3 min-w-[180px] max-w-[260px]">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-bold font-serif text-foreground">
          {monthLabelFull(data)} {data.year}
        </h3>
      </div>
      <div className="flex gap-3 text-[11px] text-muted-foreground mb-2">
        <span>{data.books.length} books</span>
        <span>·</span>
        <StarRating rating={Math.round(avg)} size={9} />
        <span>avg {avg.toFixed(1)}</span>
      </div>
      {fiveStarBooks.length > 0 && (
        <div className="space-y-1.5 border-t border-border/40 pt-2">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">★ Favourites</span>
          {fiveStarBooks.map((book, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="flex gap-0.5 shrink-0 mt-0.5">
                {book.vibes.map((v, vi) => (
                  <span key={vi} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vibeHSL[v] }} />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-foreground/90 leading-tight block truncate font-medium">{book.title}</span>
                {book.author && (
                  <span className="text-[10px] text-muted-foreground/50 block truncate">{book.author}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthTooltip;
