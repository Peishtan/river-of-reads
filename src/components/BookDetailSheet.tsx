import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import StarRating from '@/components/StarRating';
import { Book, VibeGroup, vibeLabels, vibeHSL, VIBES } from '@/data/readingData';
import { ExternalLink, Pencil, Check, X } from 'lucide-react';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookDetailSheetProps {
  book: (Book & { dateRead?: string; format?: string; summary?: string; bookId?: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookUpdated?: () => void;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BookDetailSheet = ({ book, open, onOpenChange, onBookUpdated }: BookDetailSheetProps) => {
  const { session, isCustomData } = useReadingData();
  const [editingField, setEditingField] = useState<'vibes' | 'summary' | null>(null);
  const [editVibes, setEditVibes] = useState<VibeGroup[]>([]);
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset edit state when book changes or sheet closes
  useEffect(() => {
    setEditingField(null);
    if (book) {
      setEditVibes([...book.vibes]);
      setEditSummary(book.summary || '');
    }
  }, [book, open]);

  if (!book) return null;

  const canEdit = !!session && isCustomData && !!book.bookId;

  const toggleVibe = (vibe: VibeGroup) => {
    setEditVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const handleSave = async (field: 'vibes' | 'summary') => {
    if (!book.bookId) return;
    setSaving(true);
    try {
      const updateData = field === 'vibes'
        ? { vibes: editVibes.length > 0 ? editVibes : ['current'] }
        : { summary: editSummary.trim() || null };

      const { error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', book.bookId);

      if (error) throw error;

      // Update the local book object
      if (field === 'vibes') {
        book.vibes = editVibes.length > 0 ? editVibes : ['current' as VibeGroup];
      } else {
        book.summary = editSummary.trim() || undefined;
      }

      toast.success(`${field === 'vibes' ? 'Streams' : 'Summary'} updated`);
      setEditingField(null);
      onBookUpdated?.();
    } catch (err) {
      console.error('Failed to update book:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (field: 'vibes' | 'summary') => {
    if (field === 'vibes') setEditVibes([...book.vibes]);
    else setEditSummary(book.summary || '');
    setEditingField(null);
  };

  const editableVibes = VIBES.filter(v => v !== 'current');

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
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-widest">Streams</p>
              {canEdit && editingField !== 'vibes' && (
                <button
                  onClick={() => setEditingField('vibes')}
                  className="text-muted-foreground/50 hover:text-primary transition-colors"
                  title="Edit streams"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {editingField === 'vibes' && (
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => handleSave('vibes')}
                    disabled={saving}
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel('vibes')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {editingField === 'vibes' ? (
              <div className="flex flex-wrap gap-1.5">
                {editableVibes.map(v => {
                  const selected = editVibes.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleVibe(v)}
                      className="text-xs px-2 py-1 rounded-full border transition-all"
                      style={{
                        backgroundColor: selected ? `${vibeHSL[v]}30` : 'transparent',
                        borderColor: selected ? vibeHSL[v] : 'hsl(var(--border))',
                        color: selected ? vibeHSL[v] : 'hsl(var(--muted-foreground))',
                        opacity: selected ? 1 : 0.6,
                      }}
                    >
                      {vibeLabels[v]}
                    </button>
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>

          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-widest">Summary</p>
              {canEdit && editingField !== 'summary' && (
                <button
                  onClick={() => setEditingField('summary')}
                  className="text-muted-foreground/50 hover:text-primary transition-colors"
                  title="Edit summary"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {editingField === 'summary' && (
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => handleSave('summary')}
                    disabled={saving}
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancel('summary')}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {editingField === 'summary' ? (
              <Textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="text-sm bg-background/50 border-border min-h-[120px]"
                placeholder="Add a summary..."
              />
            ) : (
              book.summary ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{book.summary}</p>
              ) : canEdit ? (
                <button
                  onClick={() => setEditingField('summary')}
                  className="text-sm text-muted-foreground/50 italic hover:text-muted-foreground transition-colors"
                >
                  Click to add a summary...
                </button>
              ) : null
            )}
          </div>

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
