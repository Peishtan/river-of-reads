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

      // Convert SVGs to canvas-friendly format before capture
      const svgs = el.querySelectorAll('svg');
      const svgBackups: { svg: SVGElement; origWidth: string; origHeight: string }[] = [];
      svgs.forEach((svg) => {
        const rect = svg.getBoundingClientRect();
        svgBackups.push({
          svg,
          origWidth: svg.getAttribute('width') || '',
          origHeight: svg.getAttribute('height') || '',
        });
        svg.setAttribute('width', String(rect.width));
        svg.setAttribute('height', String(rect.height));
      });

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(el, {
          backgroundColor: '#141b22',
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: (element) =>
            element.classList?.contains('share-exclude') ?? false,
        });
      } finally {
        // Restore SVG attributes
        svgBackups.forEach(({ svg, origWidth, origHeight }) => {
          if (origWidth) svg.setAttribute('width', origWidth);
          else svg.removeAttribute('width');
          if (origHeight) svg.setAttribute('height', origHeight);
          else svg.removeAttribute('height');
        });
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) {
        console.warn('Share: canvas.toBlob returned null');
        return;
      }

      const file = new File([blob], 'river-of-reading.png', { type: 'image/png' });

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'River of Reading',
          text: 'My reading life as a river 🌊',
          files: [file],
        });
      } else {
        // Fallback: download via link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'river-of-reading.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

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
