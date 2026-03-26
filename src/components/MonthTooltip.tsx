import { MonthData, VibeGroup, vibeLabels, vibeHSL, totalPages, avgRating, monthLabelFull } from '@/data/readingData';
import StarRating from './StarRating';

interface MonthTooltipProps {
  data: MonthData;
}

const MonthTooltip = ({ data }: MonthTooltipProps) => {
  const avg = avgRating(data);
  const tp = totalPages(data);

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl px-5 py-4 min-w-[220px] max-w-[280px]">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-bold font-serif text-foreground">
          {monthLabelFull(data)} {data.year}
        </h3>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
        <span>{data.books.length} books</span>
        <span>·</span>
        <StarRating rating={Math.round(avg)} size={10} />
        <span>avg {avg.toFixed(2)}</span>
      </div>
      <div className="space-y-1.5">
        {data.books.map((book, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: vibeHSL[book.vibe] }} />
            <span className="text-xs text-foreground/80 truncate">{book.title}</span>
            {book.rating === 5 && (
              <span className="text-[9px] font-bold ml-auto" style={{ color: 'hsl(43, 90%, 58%)' }}>★5</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthTooltip;
