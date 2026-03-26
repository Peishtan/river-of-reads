import { MonthData, vibeLabels, vibeHSL, totalPages, avgRating, monthLabelFull } from '@/data/readingData';
import StarRating from './StarRating';

interface MonthTooltipProps {
  data: MonthData;
}

const MonthTooltip = ({ data }: MonthTooltipProps) => {
  const avg = avgRating(data);

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl px-5 py-4 min-w-[220px] max-w-[300px]">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-bold font-serif text-foreground">
          {monthLabelFull(data)} {data.year}
        </h3>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
        <span>{data.books.length} books</span>
        <span>·</span>
        <StarRating rating={Math.round(avg)} size={10} />
        <span>avg {avg.toFixed(1)}</span>
      </div>
      <div className="space-y-2">
        {data.books.map((book, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex gap-0.5 shrink-0 mt-0.5">
              {book.vibes.map((v, vi) => (
                <span key={vi} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: vibeHSL[v] }} />
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-foreground/90 leading-tight block truncate font-medium">{book.title}</span>
              {book.author && (
                <span className="text-[10px] text-muted-foreground/60 block truncate">{book.author}</span>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <StarRating rating={book.rating} size={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthTooltip;
