import { useMemo } from 'react';
import { VibeGroup, vibeLabels, VIBES } from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';

interface Archetype {
  name: string;
  description: string;
  icon: JSX.Element;
}

// SVG icons as minimal silhouettes
const icons: Record<string, (color1: string, color2: string) => JSX.Element> = {
  kayaker: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Kayaker silhouette */}
      <path d="M20 38c4-2 8-3 12-3s8 1 12 3" stroke="url(#arch-grad)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="26" rx="5" ry="5.5" fill="url(#arch-grad)" />
      <path d="M28 31c0 3 1 5 4 7m4-7c0 3-1 5-4 7" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <path d="M14 35l36-6" stroke="url(#arch-grad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Water ripples */}
      <path d="M10 44q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M8 48q10-2 20 0t20 0" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.25" />
    </svg>
  ),
  fisher: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Fisher with rod */}
      <ellipse cx="28" cy="20" rx="4.5" ry="5" fill="url(#arch-grad)" />
      <path d="M28 25v12" stroke="url(#arch-grad)" strokeWidth="1.8" />
      <path d="M24 37h8" stroke="url(#arch-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 22c6-8 14-10 18-8" stroke="url(#arch-grad)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M48 14v4" stroke="url(#arch-grad)" strokeWidth="0.8" opacity="0.5" />
      {/* Water */}
      <path d="M10 42q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M8 46q10-2 20 0t20 0" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.25" />
    </svg>
  ),
  cartographer: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Compass / map */}
      <circle cx="32" cy="28" r="12" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="28" r="1.5" fill="url(#arch-grad)" />
      <path d="M32 18v4m0 12v4m-10-10h4m12 0h4" stroke="url(#arch-grad)" strokeWidth="1" opacity="0.6" />
      <path d="M32 28l-4-8 4 3 4-3-4 8z" fill="url(#arch-grad)" opacity="0.7" />
      {/* Water */}
      <path d="M10 46q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M8 50q10-2 20 0t20 0" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.25" />
    </svg>
  ),
  engineer: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Lock / gear */}
      <circle cx="32" cy="26" r="10" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="26" r="4" stroke="url(#arch-grad)" strokeWidth="1.2" fill="none" />
      {/* Gear teeth */}
      <path d="M32 14v3m0 18v3m-12-12h3m18 0h3" stroke="url(#arch-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M23.5 17.5l2 2m13 13l2 2m-2-17l-2 2m-13 13l-2 2" stroke="url(#arch-grad)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Water */}
      <path d="M10 44q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M8 48q10-2 20 0t20 0" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.25" />
    </svg>
  ),
  diver: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Diver */}
      <ellipse cx="32" cy="22" rx="5" ry="5.5" fill="url(#arch-grad)" />
      <path d="M32 27c-1 4-3 8-6 12m6-12c1 4 3 8 6 12" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <path d="M27 30c-3-1-6 0-8 2m14-2c3-1 6 0 8 2" stroke="url(#arch-grad)" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Bubbles */}
      <circle cx="38" cy="16" r="1.5" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.5" />
      <circle cx="40" cy="12" r="1" stroke="url(#arch-grad)" strokeWidth="0.6" fill="none" opacity="0.35" />
      <circle cx="42" cy="9" r="0.7" stroke="url(#arch-grad)" strokeWidth="0.5" fill="none" opacity="0.25" />
      {/* Water */}
      <path d="M10 44q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  ),
  explorer: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Branching delta paths */}
      <path d="M32 14v10m0 0l-12 18m12-18l12 18m-12-18l-5 18m5-18l5 18" stroke="url(#arch-grad)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="32" cy="12" r="3" fill="url(#arch-grad)" opacity="0.8" />
      {/* Water */}
      <path d="M10 46q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  ),
  submariner: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Submarine */}
      <ellipse cx="32" cy="30" rx="16" ry="7" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <path d="M28 23v-4h8v4" stroke="url(#arch-grad)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="30" r="2" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="32" cy="30" r="2" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.6" />
      <circle cx="40" cy="30" r="2" stroke="url(#arch-grad)" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Bubbles */}
      <circle cx="36" cy="16" r="1.2" stroke="url(#arch-grad)" strokeWidth="0.6" fill="none" opacity="0.4" />
      <circle cx="38" cy="12" r="0.8" stroke="url(#arch-grad)" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* Water */}
      <path d="M10 42q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.3" />
    </svg>
  ),
  keeper: (c1, c2) => (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id="arch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Lantern / lighthouse */}
      <rect x="28" y="18" width="8" height="20" rx="1" stroke="url(#arch-grad)" strokeWidth="1.5" fill="none" />
      <path d="M26 38h12" stroke="url(#arch-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 18v-4h4v4" stroke="url(#arch-grad)" strokeWidth="1" fill="none" />
      {/* Light rays */}
      <path d="M32 14l-6-4m6 4l6-4m-6 4v-6" stroke="url(#arch-grad)" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
      <rect x="30" y="24" width="4" height="4" rx="0.5" fill="url(#arch-grad)" opacity="0.3" />
      {/* Water */}
      <path d="M10 44q8-3 16 0t16 0" stroke="url(#arch-grad)" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  ),
};

interface ArchetypeRule {
  match: (sorted: [VibeGroup, number][], total: number) => boolean;
  archetype: Archetype;
  iconKey: string;
}

const rules: ArchetypeRule[] = [
  // Combo archetypes first (more specific)
  {
    match: (s) => {
      const top2 = new Set(s.slice(0, 2).map(([v]) => v));
      return top2.has('escapist') && top2.has('ideas');
    },
    archetype: { name: 'The Submarine Pilot', description: 'Dives deep into speculative worlds where ideas and adventure merge beneath the surface.', icon: <></> },
    iconKey: 'submariner',
  },
  {
    match: (s) => {
      const top2 = new Set(s.slice(0, 2).map(([v]) => v));
      return top2.has('history') && top2.has('life');
    },
    archetype: { name: 'The River Keeper', description: 'Tends the currents between past and present, finding meaning where history meets lived experience.', icon: <></> },
    iconKey: 'keeper',
  },
  // Dominant archetypes
  {
    match: (s, t) => s[0][0] === 'escapist' && s[0][1] / t > 0.28,
    archetype: { name: 'The White-Water Kayaker', description: 'Chases the rapids — drawn to adventure, world-building, and the thrill of the unknown.', icon: <></> },
    iconKey: 'kayaker',
  },
  {
    match: (s, t) => s[0][0] === 'life' && s[0][1] / t > 0.28,
    archetype: { name: 'The Fly Fisher', description: 'Reads the subtle currents — patient, reflective, casting lines into the deeper waters of life.', icon: <></> },
    iconKey: 'fisher',
  },
  {
    match: (s, t) => s[0][0] === 'history' && s[0][1] / t > 0.28,
    archetype: { name: 'The Cartographer', description: 'Maps the world through its stories — charting wars, civilizations, and the tides of time.', icon: <></> },
    iconKey: 'cartographer',
  },
  {
    match: (s, t) => s[0][0] === 'ideas' && s[0][1] / t > 0.28,
    archetype: { name: 'The Lock Engineer', description: 'Tinkers with ideas and tests the current against logic — fascinated by how systems work.', icon: <></> },
    iconKey: 'engineer',
  },
  {
    match: (s, t) => s[0][0] === 'nature' && s[0][1] / t > 0.28,
    archetype: { name: 'The Drift Diver', description: 'Lets the current carry through wild places — drawn to the ocean, the land, and the untamed.', icon: <></> },
    iconKey: 'diver',
  },
  // Fallback: even spread
  {
    match: () => true,
    archetype: { name: 'The Delta Explorer', description: 'Reading branches in every direction — no single current defines the journey, and that\'s the beauty of it.', icon: <></> },
    iconKey: 'explorer',
  },
];

const ReaderArchetype = () => {
  const { data: readingData, riverColors } = useReadingData();

  const result = useMemo(() => {
    if (!readingData || readingData.length === 0) return null;

    // Count books per vibe (excluding 'current')
    const counts: Record<string, number> = {};
    let total = 0;
    for (const month of readingData) {
      for (const book of month.books) {
        for (const vibe of book.vibes) {
          if (vibe === 'current') continue;
          counts[vibe] = (counts[vibe] || 0) + 1;
          total++;
        }
      }
    }

    if (total === 0) return null;

    const sorted: [VibeGroup, number][] = (Object.entries(counts) as [VibeGroup, number][])
      .sort((a, b) => b[1] - a[1]);

    for (const rule of rules) {
      if (rule.match(sorted, total)) {
        const top2Vibes = sorted.slice(0, 2).map(([v]) => v);
        const c1 = riverColors[top2Vibes[0]] || 'hsl(200, 40%, 50%)';
        const c2 = riverColors[top2Vibes[1]] || 'hsl(200, 30%, 40%)';
        const color1 = c1.startsWith('hsl') ? c1 : `hsl(${c1})`;
        const color2 = c2.startsWith('hsl') ? c2 : `hsl(${c2})`;
        // Lightened versions for readable text
        const textColor1 = `color-mix(in srgb, ${color1} 55%, white)`;
        const textColor2 = `color-mix(in srgb, ${color2} 55%, white)`;

        return {
          ...rule.archetype,
          icon: icons[rule.iconKey](color1, color2),
          color1,
          color2,
          textColor1,
          textColor2,
        };
      }
    }
    return null;
  }, [readingData, riverColors]);

  if (!result) return null;

  return (
    <div className="group relative flex items-center justify-center gap-3 mt-1">
      {/* Circle avatar with gradient border */}
      <div
        className="w-12 h-12 rounded-full p-[1.5px] flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${result.color1}, ${result.color2})`,
        }}
      >
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center p-0.5">
          {result.icon}
        </div>
      </div>
      {/* Archetype name — plain light text for readability */}
      <span
        className="text-sm font-serif font-bold tracking-wider uppercase cursor-default text-foreground/90"
      >
        {result.name}
      </span>
      {/* Hover tooltip */}
      <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-md px-3 py-2 shadow-lg max-w-xs">
          <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
            {result.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReaderArchetype;
