import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Check } from 'lucide-react';

interface ShareRiverButtonProps {
  captureSelector: string;
}

function downloadBlob(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'river-of-reading.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

      // 1. Create off-screen container with a deep clone
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const clone = el.cloneNode(true) as HTMLElement;

      // Remove elements marked as share-exclude
      clone.querySelectorAll('.share-exclude').forEach((n) => n.remove());

      // Copy computed styles for the root
      const elStyles = getComputedStyle(el);
      clone.style.width = elStyles.width;
      clone.style.backgroundColor = elStyles.backgroundColor || '#141b22';

      // Inline SVG dimensions so html2canvas can rasterise them
      const origSvgs = el.querySelectorAll('svg');
      const cloneSvgs = clone.querySelectorAll('svg');
      origSvgs.forEach((origSvg, i) => {
        const rect = origSvg.getBoundingClientRect();
        const cloneSvg = cloneSvgs[i];
        if (cloneSvg) {
          cloneSvg.setAttribute('width', String(rect.width));
          cloneSvg.setAttribute('height', String(rect.height));
        }
      });

      container.appendChild(clone);

      // Wait for fonts
      await document.fonts.ready;

      try {
        const canvas = await html2canvas(clone, {
          width: clone.scrollWidth,
          height: clone.scrollHeight,
          scale: 2,
          backgroundColor: '#141b22',
          useCORS: true,
          logging: false,
          allowTaint: true,
          foreignObjectRendering: false,
        });

        canvas.toBlob((blob) => {
          if (!blob) {
            console.warn('Share: canvas.toBlob returned null');
            return;
          }

          const file = new File([blob], 'river-of-reading.png', { type: 'image/png' });

          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            navigator.share({
              title: 'River of Reading',
              text: 'My reading life as a river 🌊',
              files: [file],
            }).catch(() => {
              const url = URL.createObjectURL(blob);
              downloadBlob(url);
            });
          } else {
            const url = URL.createObjectURL(blob);
            downloadBlob(url);
          }

          setDone(true);
          setTimeout(() => setDone(false), 2000);
        }, 'image/png');
      } finally {
        document.body.removeChild(container);
      }
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
