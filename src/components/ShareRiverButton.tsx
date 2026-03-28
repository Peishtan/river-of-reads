import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Check } from 'lucide-react';

interface ShareRiverButtonProps {
  /** CSS selector or ref for the capturable region */
  captureSelector: string;
}

const ShareRiverButton = ({ captureSelector }: ShareRiverButtonProps) => {
  const [capturing, setCapturing] = useState(false);
  const [done, setDone] = useState(false);

  const capture = useCallback(async () => {
    setCapturing(true);
    try {
      const el = document.querySelector(captureSelector) as HTMLElement | null;
      if (!el) {
        console.warn('Share: capturable element not found');
        return;
      }

      const canvas = await html2canvas(el, {
        backgroundColor: '#141b22', // --background approx
        scale: 2,
        useCORS: true,
        logging: false,
        // Ignore interactive-only elements
        ignoreElements: (element) =>
          element.classList?.contains('share-exclude') ?? false,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const file = new File([blob], 'river-of-reading.png', { type: 'image/png' });

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'River of Reading',
          text: 'My reading life as a river 🌊',
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'river-of-reading.png';
        a.click();
        URL.revokeObjectURL(url);
      }

      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      console.warn('Share failed:', err);
    } finally {
      setCapturing(false);
    }
  }, [captureSelector]);

  return (
    <button
      onClick={capture}
      disabled={capturing}
      className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      title="Share your river"
    >
      {done ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : capturing ? (
        <Download className="w-3.5 h-3.5 animate-pulse" />
      ) : (
        <Share2 className="w-3.5 h-3.5" />
      )}
      <span>{capturing ? 'Capturing…' : done ? 'Saved!' : 'Share'}</span>
    </button>
  );
};

export default ShareRiverButton;
