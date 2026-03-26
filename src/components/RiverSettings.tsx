import { useState } from 'react';
import { useReadingData } from '@/contexts/ReadingDataContext';
import { VIBES, VibeGroup, vibeLabels } from '@/data/readingData';

/** Convert "hsl(h, s%, l%)" to hex for color input */
function hslToHex(hslStr: string): string {
  const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#4488aa';
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/** Convert hex to hsl string */
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

interface RiverSettingsProps {
  open: boolean;
  onClose: () => void;
}

const RiverSettings = ({ open, onClose }: RiverSettingsProps) => {
  const { riverColors, setRiverColor } = useReadingData();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-serif text-foreground">River Colors</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Customize the color of each river tributary.
        </p>
        <div className="space-y-3">
          {VIBES.map(vibe => (
            <div key={vibe} className="flex items-center gap-3">
              <input
                type="color"
                value={hslToHex(riverColors[vibe])}
                onChange={(e) => setRiverColor(vibe, hexToHsl(e.target.value))}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
              />
              <span className="text-sm text-foreground flex-1">{vibeLabels[vibe]}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{riverColors[vibe]}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default RiverSettings;
