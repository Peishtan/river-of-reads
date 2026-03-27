import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import { Book, VibeGroup, vibeLabels, vibeHSL } from '@/data/readingData';
import { ExternalLink } from 'lucide-react';

interface BookDetailSheetProps {
  book: (Book & { dateRead?: string; format?: string; summary?: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BookDetailSheet = ({ book, open, onOpenChange }: BookDetailSheetProps) => {
  if (!book) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-xl text-foreground leading-tight pr-6">
            {book.title}
          </SheetTitle>
          {book.author && (
            <p className="text-sm text-muted-foreground">{book.author}</p>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Rating */}
          <div>
            <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-1.5">Rating</p>
            <StarRating rating={book.rating} size={18} />
          </div>

          {/* Date & Format */}
          <div className="flex gap-8">
            {book.dateRead && (
              <div>
                <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-1.5">Date Read</p>
                <p className="text-sm text-foreground">
                  {(() => {
                    const d = new Date(book.dateRead);
                    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                  })()}
                </p>
              </div>
            )}
            {book.format && (
              <div>
                <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-1.5">Format</p>
                <p className="text-sm text-foreground capitalize">{book.format}</p>
              </div>
            )}
          </div>

          {/* Vibes */}
          <div>
            <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-2">Streams</p>
            <div className="flex flex-wrap gap-1.5">
              {book.vibes.map(v => (
                <Badge
                  key={v}
                  variant="outline"
                  className="text-xs border-border/60"
                  style={{
                    backgroundColor: `${vibeHSL[v]}20`,
                    borderColor: vibeHSL[v],
                    color: vibeHSL[v],
                  }}
                >
                  {vibeLabels[v]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Summary */}
          {book.summary && (
            <div>
              <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{book.summary}</p>
            </div>
          )}

          {/* Goodreads link */}
          <a
            href={`https://www.goodreads.com/search?q=${encodeURIComponent(`${book.title} ${book.author}`.trim())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors underline underline-offset-4"
          >
            Find on Goodreads <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookDetailSheet;
