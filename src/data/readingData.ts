export type VibeGroup = 'escapist' | 'ideas' | 'nature' | 'history';

export const vibeLabels: Record<VibeGroup, string> = {
  escapist: 'Escapist & adventure',
  ideas: 'Ideas & technology',
  nature: 'Nature & ocean',
  history: 'History & world',
};

export const vibeHSL: Record<VibeGroup, string> = {
  escapist: 'hsl(158, 50%, 40%)',
  ideas: 'hsl(170, 55%, 32%)',
  nature: 'hsl(176, 50%, 42%)',
  history: 'hsl(200, 55%, 52%)',
};

export interface Book {
  title: string;
  author: string;
  vibe: VibeGroup;
  rating: number;
  pages: number;
  /** Optional annotation to show on the river */
  annotation?: string;
}

export interface MonthData {
  year: number;
  month: number; // 0-11
  books: Book[];
}

// Helper
const m = (year: number, month: number, books: Book[]): MonthData => ({
  year,
  month,
  books,
});

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthLabel = (d: MonthData) => MONTHS[d.month];
export const monthLabelFull = (d: MonthData) => {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[d.month];
};

export const readingData: MonthData[] = [
  // 2021
  m(2021, 0, [
    { title: 'Lass surge', author: '', vibe: 'escapist', rating: 4, pages: 320, annotation: 'Lass surge' },
  ]),
  m(2021, 1, [
    { title: 'The Wave', author: 'Susan Casey', vibe: 'nature', rating: 4, pages: 280 },
    { title: 'Four Winds', author: 'Kristin Hannah', vibe: 'escapist', rating: 5, pages: 450, annotation: 'The Wave · Four Winds' },
  ]),
  m(2021, 2, [
    { title: 'Travels in the Vile', author: '', vibe: 'history', rating: 3, pages: 310, annotation: 'Travels in the Vile' },
  ]),
  m(2021, 4, [
    { title: 'Deep River', author: '', vibe: 'nature', rating: 4, pages: 290 },
    { title: 'Salt Path', author: 'Raynor Winn', vibe: 'nature', rating: 5, pages: 260 },
  ]),
  m(2021, 6, [
    { title: 'ACOSITAR', author: 'Sarah J. Maas', vibe: 'escapist', rating: 5, pages: 520, annotation: 'ACOSITAR' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', vibe: 'ideas', rating: 4, pages: 440 },
  ]),
  m(2021, 8, [
    { title: 'Project Hail Mary', author: 'Andy Weir', vibe: 'ideas', rating: 5, pages: 470 },
    { title: 'Dune', author: 'Frank Herbert', vibe: 'escapist', rating: 5, pages: 410 },
  ]),
  m(2021, 10, [
    { title: 'Piranesi', author: 'Susanna Clarke', vibe: 'escapist', rating: 5, pages: 250 },
    { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', vibe: 'ideas', rating: 4, pages: 300 },
  ]),
  // 2022
  m(2022, 0, [
    { title: 'Red Rising trilogy', author: 'Pierce Brown', vibe: 'escapist', rating: 5, pages: 980, annotation: 'Red Rising trilogy' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', vibe: 'ideas', rating: 4, pages: 350 },
  ]),
  m(2022, 2, [
    { title: 'Hamnet', author: "Maggie O'Farrell", vibe: 'history', rating: 5, pages: 370 },
    { title: 'Circe', author: 'Madeline Miller', vibe: 'escapist', rating: 5, pages: 390 },
    { title: 'The Overstory', author: 'Richard Powers', vibe: 'nature', rating: 5, pages: 500 },
    { title: 'Atomic Habits', author: 'James Clear', vibe: 'ideas', rating: 4, pages: 320 },
    { title: 'SPQR', author: 'Mary Beard', vibe: 'history', rating: 4, pages: 290 },
    { title: 'Sea People', author: 'Christina Thompson', vibe: 'history', rating: 4, pages: 310 },
    { title: 'Educated', author: 'Tara Westover', vibe: 'ideas', rating: 5, pages: 330 },
    { title: 'Normal People', author: 'Sally Rooney', vibe: 'escapist', rating: 4, pages: 260 },
  ]),
  m(2022, 4, [
    { title: 'Hella Beautiful Sunrise', author: '', vibe: 'nature', rating: 4, pages: 200, annotation: 'Hella Beautiful\nSunrise novels' },
  ]),
  m(2022, 6, [
    { title: 'Famous Friskett Sullivan', author: '', vibe: 'escapist', rating: 3, pages: 280, annotation: 'Famous Friskett Sullivan' },
  ]),
  m(2022, 9, [
    { title: 'Kavaler & Clay', author: 'Michael Chabon', vibe: 'escapist', rating: 5, pages: 640, annotation: 'Kavaler & Clay\n+ ocean surge' },
    { title: 'The Silk Roads', author: 'Peter Frankopan', vibe: 'history', rating: 4, pages: 510 },
  ]),
  // 2023
  m(2023, 0, [
    { title: 'AI deep-dive', author: '', vibe: 'ideas', rating: 4, pages: 380, annotation: 'AI deep-dive' },
    { title: 'Neuromancer', author: 'William Gibson', vibe: 'ideas', rating: 4, pages: 270 },
  ]),
  m(2023, 3, [
    { title: 'Throne of Glass', author: 'Sarah J. Maas', vibe: 'escapist', rating: 5, pages: 880, annotation: 'Throne of Glass' },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', vibe: 'ideas', rating: 5, pages: 280 },
  ]),
  m(2023, 6, [
    { title: 'History & Ideas surge', author: '', vibe: 'history', rating: 4, pages: 450 },
    { title: 'Nature & ocean', author: '', vibe: 'nature', rating: 4, pages: 350 },
  ]),
  m(2023, 9, [
    { title: 'Exhalation', author: 'Ted Chiang', vibe: 'ideas', rating: 5, pages: 350 },
    { title: 'Beloved', author: 'Toni Morrison', vibe: 'escapist', rating: 5, pages: 320 },
  ]),
  // 2024
  m(2024, 0, [
    { title: 'History & world', author: '', vibe: 'history', rating: 4, pages: 400 },
  ]),
  m(2024, 3, [
    { title: 'Escapist & adventure', author: '', vibe: 'escapist', rating: 4, pages: 520 },
    { title: 'Ideas & technology', author: '', vibe: 'ideas', rating: 4, pages: 310 },
  ]),
  m(2024, 6, [
    { title: 'Nature & ocean', author: '', vibe: 'nature', rating: 4, pages: 280 },
    { title: 'Main current (all books)', author: '', vibe: 'escapist', rating: 4, pages: 600, annotation: 'Main current (all books)' },
  ]),
  m(2024, 9, [
    { title: 'Surge', author: '', vibe: 'escapist', rating: 5, pages: 700 },
    { title: 'Ideas wave', author: '', vibe: 'ideas', rating: 4, pages: 340 },
  ]),
  // 2025
  m(2025, 0, [
    { title: 'Nature retreat', author: '', vibe: 'nature', rating: 5, pages: 300 },
    { title: 'History dive', author: '', vibe: 'history', rating: 4, pages: 420 },
  ]),
  m(2025, 4, [
    { title: 'Escapist surge', author: '', vibe: 'escapist', rating: 5, pages: 800 },
  ]),
  m(2025, 8, [
    { title: 'Ideas bloom', author: '', vibe: 'ideas', rating: 5, pages: 400 },
    { title: 'Ocean stories', author: '', vibe: 'nature', rating: 4, pages: 320 },
  ]),
  // 2026
  m(2026, 0, [
    { title: 'New year reads', author: '', vibe: 'escapist', rating: 4, pages: 350 },
    { title: 'Tech future', author: '', vibe: 'ideas', rating: 4, pages: 280 },
  ]),
  m(2026, 2, [
    { title: 'Spring reading', author: '', vibe: 'nature', rating: 4, pages: 220 },
  ]),
];

/** Get total pages for a month */
export const totalPages = (d: MonthData) => d.books.reduce((a, b) => a + b.pages, 0);

/** Get average rating */
export const avgRating = (d: MonthData) => {
  if (d.books.length === 0) return 0;
  return d.books.reduce((a, b) => a + b.rating, 0) / d.books.length;
};

/** Get unique years */
export const getYears = () => [...new Set(readingData.map(d => d.year))].sort();

/** Convert month data to a sequential index for x positioning */
export const toMonthIndex = (d: MonthData) => (d.year - 2021) * 12 + d.month;
