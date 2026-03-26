export type VibeGroup = 'escapist' | 'ideas' | 'nature' | 'history' | 'life';

export const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'life'];

export const vibeLabels: Record<VibeGroup, string> = {
  escapist: 'Escapist & Adventure',
  ideas: 'Ideas & Technology',
  nature: 'Nature & Ocean',
  history: 'History & World',
  life: 'Life & Reflective',
};

export const defaultVibeHSL: Record<VibeGroup, string> = {
  nature:   'hsl(175, 25%, 42%)',   // The Wild — Muted Teal
  history:  'hsl(220, 35%, 30%)',   // The World — Deep Navy
  ideas:    'hsl(215, 18%, 55%)',   // The Lab — Slate Blue
  escapist: 'hsl(18, 45%, 52%)',    // The Escape — Terracotta
  life:     'hsl(130, 15%, 52%)',   // The Hearth — Sage Green
};

// Kept as mutable reference that can be overridden by river settings
export let vibeHSL: Record<VibeGroup, string> = { ...defaultVibeHSL };

export const setVibeHSL = (colors: Record<VibeGroup, string>) => {
  vibeHSL = { ...colors };
};

/** Map raw tag strings to vibe groups */
export const TAG_TO_VIBE: Record<string, VibeGroup> = {
  // Nature & Ocean
  nature: 'nature', travel: 'nature',
  // History & World
  history: 'history', culture: 'history', politics: 'history', memoir: 'history', legal: 'history',
  // Ideas & Technology
  business: 'ideas', future: 'ideas', 'idea-dense': 'ideas', science: 'ideas',
  systems: 'ideas', technology: 'ideas', 'philosophy-lite': 'ideas', practical: 'ideas', psychology: 'ideas',
  // Escapist & Adventure
  adventure: 'escapist', escapist: 'escapist', mystery: 'escapist', thriller: 'escapist',
  dystopian: 'escapist', dark: 'escapist', bleak: 'escapist', uncomfortable: 'escapist',
  // Life & Reflective
  reflective: 'life', literary: 'life', warm: 'life', hope: 'life', food: 'life', craft: 'life',
};

export function tagsToVibes(tagString: string): VibeGroup[] {
  const tags = tagString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const vibeSet = new Set<VibeGroup>();
  for (const tag of tags) {
    const vibe = TAG_TO_VIBE[tag];
    if (vibe) vibeSet.add(vibe);
  }
  return vibeSet.size > 0 ? Array.from(vibeSet) : ['life']; // default
}

export interface Book {
  title: string;
  author: string;
  vibes: VibeGroup[];
  rating: number;
  pages: number;
  annotation?: string;
}

export interface MonthData {
  year: number;
  month: number; // 0-11
  books: Book[];
}

const m = (year: number, month: number, books: Book[]): MonthData => ({
  year, month, books,
});

const b = (title: string, vibes: VibeGroup | VibeGroup[], rating = 4, pages = 300, author = '', annotation?: string): Book => ({
  title, author,
  vibes: Array.isArray(vibes) ? vibes : [vibes],
  rating, pages, annotation,
});

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthLabel = (d: MonthData) => MONTHS[d.month];
export const monthLabelFull = (d: MonthData) => {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[d.month];
};

// Minimal demo data — real data comes from CSV upload
export const readingData: MonthData[] = [
  m(2021, 0, [b('Dune', 'escapist', 5, 410), b('Sapiens', 'ideas', 4, 440)]),
  m(2021, 3, [b('Salt Path', 'nature', 5, 260), b('Atomic Habits', 'ideas', 4, 320), b('Born a Crime', ['history', 'life'], 5, 290)]),
  m(2021, 6, [
    b('ACOTAR', 'escapist', 5, 520), b('Project Hail Mary', 'ideas', 5, 470),
    b('Sea People', 'history', 4, 310), b('Becoming', 'life', 4, 420),
  ]),
  m(2021, 9, [b('Beloved', 'escapist', 5, 320), b('The Immortal Life', 'life', 4, 380)]),
  m(2022, 0, [b('Red Rising', 'escapist', 5, 480), b('AI Superpowers', 'ideas', 4, 350)]),
  m(2022, 3, [b('Children of Time', 'ideas', 5, 480), b('The Great Alone', 'nature', 4, 380)]),
  m(2022, 6, [b('Cadillac Desert', 'nature', 4, 580), b('The Poppy War', 'escapist', 5, 530)]),
  m(2022, 9, [b('Babel', ['history', 'escapist'], 5, 540), b('Silk Roads', 'history', 4, 510)]),
  m(2023, 0, [b('AI deep-dive', 'ideas', 4, 380), b('Neuromancer', ['ideas', 'escapist'], 4, 270)]),
  m(2023, 3, [
    b('Throne of Glass', 'escapist', 5, 880), b('Silent Spring', 'nature', 5, 380),
    b('The Anarchy', 'history', 5, 520), b('Educated', 'life', 5, 330),
  ]),
  m(2023, 6, [b('History surge', 'history', 4, 450), b('Nature retreat', 'nature', 4, 350)]),
  m(2023, 9, [b('Exhalation', 'ideas', 5, 350), b('Beloved', 'escapist', 5, 320)]),
  m(2024, 0, [b('Outline', 'life', 4, 250), b('SPQR', 'history', 4, 400)]),
  m(2024, 3, [b('Stormlight', 'escapist', 5, 1050), b('Life 3.0', 'ideas', 4, 360)]),
  m(2024, 6, [b('Earthsea', 'escapist', 5, 200), b('Debt', 'ideas', 4, 540), b('Underland', 'nature', 5, 380)]),
  m(2024, 9, [b('Jonathan Strange', 'escapist', 5, 780), b('The Gene', 'ideas', 4, 590)]),
  m(2025, 0, [b('Nature retreat', 'nature', 5, 300), b('History dive', 'history', 4, 420)]),
  m(2025, 3, [b('Lions of Al-Rassan', 'escapist', 5, 500), b('The Wager', 'history', 5, 330)]),
  m(2025, 6, [b('Lies of Locke Lamora', 'escapist', 5, 720), b('Antifragile', 'ideas', 4, 520)]),
  m(2025, 9, [b('Autumn reads', 'escapist', 4, 350), b('Sapiens recap', 'ideas', 4, 440)]),
  m(2026, 0, [b('New year', 'escapist', 4, 350), b('Tech future', 'ideas', 4, 280)]),
  m(2026, 2, [b('Spring reading', 'nature', 4, 220), b('Dispossessed', ['ideas', 'escapist'], 5, 340)]),
];

export const totalPages = (d: MonthData) => d.books.reduce((a, b) => a + b.pages, 0);

export const avgRating = (d: MonthData) => {
  if (d.books.length === 0) return 0;
  return d.books.reduce((a, b) => a + b.rating, 0) / d.books.length;
};

export const getYears = () => [...new Set(readingData.map(d => d.year))].sort();

export const toMonthIndex = (d: MonthData) => (d.year - 2021) * 12 + d.month;
