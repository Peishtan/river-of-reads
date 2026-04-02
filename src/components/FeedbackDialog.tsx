import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { toast } from 'sonner';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { session } = useReadingData();
  const [type, setType] = useState('general');
  const [bookTitle, setBookTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        feedback_type: type,
        book_title: type === 'data-correction' ? bookTitle.trim() || null : null,
        message: message.trim(),
        user_id: session?.user?.id || null,
      });

      if (error) throw error;

      toast.success('Thanks for the feedback!');
      setType('general');
      setBookTitle('');
      setMessage('');
      onOpenChange(false);
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error('Failed to submit feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-foreground">Send a Ripple</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Leave a note in the current.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General feedback</SelectItem>
                <SelectItem value="data-correction">Data correction</SelectItem>
                <SelectItem value="feature-request">Feature request</SelectItem>
                <SelectItem value="bug">Bug report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'data-correction' && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">Book title</Label>
              <Input
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Which book?"
                className="bg-background border-border"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70 uppercase tracking-widest">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-background border-border min-h-[100px]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
