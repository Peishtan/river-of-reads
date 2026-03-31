import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Check } from 'lucide-react';

interface ShareRiverButtonProps {
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

      // Temporarily set explicit dimensions on SVGs for html2canvas compatibility
      const svgs = el.querySelectorAll('svg');
      const svgBackups: { svg: SVGElement; w: string; h: string }[] = [];
      svgs.forEach((svg) => {
        const rect = svg.getBoundingClientRect();
        svgBackups.push({
          svg,
          w: svg.getAttribute('width') || '',
          h: svg.getAttribute('height') || '',
        });
        svg.setAttribute('width', String(rect.width));
        svg.setAttribute('height', String(rect.height));
      });

      // Hide share-exclude elements temporarily
      const excluded = el.querySelectorAll('.share-exclude') as NodeListOf<HTMLElement>;
      excluded.forEach((n) => (n.style.display = 'none'));

      await document.fonts.ready;

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(el, {
          backgroundColor: '#0B1215',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
        });
      } finally {
        // Restore SVGs
        svgBackups.forEach(({ svg, w, h }) => {
          if (w) svg.setAttribute('width', w);
          else svg.removeAttribute('width');
          if (h) svg.setAttribute('height', h);
          else svg.removeAttribute('height');
        });
        // Restore excluded elements
        excluded.forEach((n) => (n.style.display = ''));
      }

      // Convert to blob with promise wrapper
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) {
        console.warn('Share: canvas.toBlob returned null');
        return;
      }

      const file = new File([blob], 'river-of-reading.png', { type: 'image/png' });

      // Prefer native share (shows the share sheet on mobile)
      if (navigator.share) {
        try {
          const shareData: ShareData = {
            title: 'River of Reads',
            text: 'My reading life as a river 🌊',
            files: [file],
          };
          if (navigator.canShare?.(shareData)) {
            await navigator.share(shareData);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
            return;
          }
        } catch (err) {
          // User cancelled or share failed — fall through to download
          if ((err as DOMException)?.name === 'AbortError') {
            return; // user cancelled, do nothing
          }
          console.warn('Native share failed, falling back to download', err);
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'river-of-reading.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
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
