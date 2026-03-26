export type VibeGroup = 'escapist' | 'ideas' | 'nature' | 'history' | 'memoir';

export const vibeLabels: Record<VibeGroup, string> = {
  escapist: 'Escapist & Adventure',
  ideas: 'Ideas & Technology',
  nature: 'Nature & Ocean',
  history: 'History & World',
  memoir: 'Memoir & Life',
};

export const vibeHSL: Record<VibeGroup, string> = {
  escapist: 'hsl(195, 60%, 50%)',   // bright cerulean
  ideas:    'hsl(210, 45%, 40%)',    // deep steel blue
  nature:   'hsl(160, 35%, 45%)',    // sage green-teal
  history:  'hsl(180, 40%, 35%)',    // dark teal
  memoir:   'hsl(220, 35%, 55%)',    // muted periwinkle
};

export interface Book {
  title: string;
  author: string;
  vibe: VibeGroup;
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

const b = (title: string, vibe: VibeGroup, rating = 4, pages = 300, author = '', annotation?: string): Book => ({
  title, author, vibe, rating, pages, annotation,
});

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthLabel = (d: MonthData) => MONTHS[d.month];
export const monthLabelFull = (d: MonthData) => {
  const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[d.month];
};

// Rich dummy data with surges
export const readingData: MonthData[] = [
  // 2021
  m(2021, 0, [b('Dune', 'escapist', 5, 410), b('Sapiens', 'ideas', 4, 440)]),
  m(2021, 1, [b('The Wave', 'nature', 4, 280), b('Four Winds', 'escapist', 5, 450), b('Educated', 'memoir', 5, 330)]),
  m(2021, 2, [b('SPQR', 'history', 4, 290), b('Piranesi', 'escapist', 5, 250)]),
  m(2021, 3, [b('Salt Path', 'nature', 5, 260), b('Atomic Habits', 'ideas', 4, 320), b('Born a Crime', 'memoir', 5, 290)]),
  m(2021, 4, [b('Deep River', 'nature', 4, 290), b('Circe', 'escapist', 5, 390), b('Neuromancer', 'ideas', 4, 270)]),
  m(2021, 5, [b('The Overstory', 'nature', 5, 500), b('Hamnet', 'history', 5, 370)]),
  m(2021, 6, [
    b('ACOTAR', 'escapist', 5, 520, '', 'ACOTAR'), b('Project Hail Mary', 'ideas', 5, 470),
    b('Sea People', 'history', 4, 310), b('Becoming', 'memoir', 4, 420),
    b('Klara and the Sun', 'ideas', 4, 300), b('The Silk Roads', 'history', 4, 510),
    b('Red Rising', 'escapist', 5, 380),
  ]),
  m(2021, 7, [b('Normal People', 'escapist', 4, 260), b('Exhalation', 'ideas', 5, 350), b('Wild', 'memoir', 4, 310)]),
  m(2021, 8, [
    b('Throne of Glass', 'escapist', 5, 400), b('Thinking Fast', 'ideas', 4, 350),
    b('Braiding Sweetgrass', 'nature', 5, 390), b('The Glass Castle', 'memoir', 5, 280),
    b('Guns Germs Steel', 'history', 4, 420), b('Piranesi', 'escapist', 5, 250),
    b('Left Hand of Darkness', 'ideas', 5, 280), b('H is for Hawk', 'nature', 4, 300),
  ]),
  m(2021, 9, [b('Beloved', 'escapist', 5, 320), b('The Immortal Life', 'memoir', 4, 380)]),
  m(2021, 10, [b('Kavaler & Clay', 'escapist', 5, 640), b('Midnight Library', 'escapist', 4, 280), b('When Breath Becomes Air', 'memoir', 5, 230)]),
  m(2021, 11, [b('East of Eden', 'escapist', 5, 600), b('Underland', 'nature', 4, 380)]),

  // 2022
  m(2022, 0, [b('Red Rising 2', 'escapist', 5, 480), b('AI Superpowers', 'ideas', 4, 350), b('Know My Name', 'memoir', 5, 360)]),
  m(2022, 1, [b('The Name of the Wind', 'escapist', 5, 660), b('Entangled Life', 'nature', 5, 340)]),
  m(2022, 2, [
    b('Mistborn', 'escapist', 5, 540), b('Homo Deus', 'ideas', 4, 440),
    b('The Hidden Life of Trees', 'nature', 4, 280), b('Rubicon', 'history', 4, 400),
    b('Crying in H Mart', 'memoir', 5, 240), b('Station Eleven', 'escapist', 4, 330),
    b('Algorithms to Live By', 'ideas', 4, 360), b('Wilding', 'nature', 4, 320),
    b('1491', 'history', 4, 540), b('Greenlights', 'memoir', 4, 280),
  ]),
  m(2022, 3, [b('Children of Time', 'ideas', 5, 480), b('The Great Alone', 'nature', 4, 380)]),
  m(2022, 4, [b('Hella Beautiful', 'nature', 4, 200), b('Anxious People', 'escapist', 4, 340), b('Persepolis', 'memoir', 5, 160)]),
  m(2022, 5, [b('Recursion', 'ideas', 4, 320), b('The Song of Achilles', 'escapist', 5, 370), b('Empire of Pain', 'memoir', 4, 530)]),
  m(2022, 6, [b('Famous Friskett', 'escapist', 3, 280), b('Cadillac Desert', 'nature', 4, 580)]),
  m(2022, 7, [
    b('The Poppy War', 'escapist', 5, 530), b('Gödel Escher Bach', 'ideas', 5, 770),
    b('Log from Sea of Cortez', 'nature', 4, 280), b('The Crusades', 'history', 4, 440),
    b('Shoe Dog', 'memoir', 5, 380), b('Dark Matter', 'ideas', 4, 340),
    b('Remarkably Bright Creatures', 'nature', 4, 270),
  ]),
  m(2022, 8, [b('Babel', 'history', 5, 540), b('Frankenstein', 'escapist', 4, 280)]),
  m(2022, 9, [b('Kavaler & Clay', 'escapist', 5, 640), b('The Silk Roads', 'history', 4, 510), b('Man\'s Search for Meaning', 'memoir', 5, 160)]),
  m(2022, 10, [b('Elantris', 'escapist', 4, 490), b('The Disappearing Spoon', 'ideas', 4, 390)]),
  m(2022, 11, [b('The Bear and Nightingale', 'escapist', 5, 320), b('Vesper Flights', 'nature', 5, 280), b('Open', 'memoir', 4, 380)]),

  // 2023
  m(2023, 0, [b('AI deep-dive', 'ideas', 4, 380), b('Neuromancer', 'ideas', 4, 270), b('The Year of Magical Thinking', 'memoir', 5, 230)]),
  m(2023, 1, [b('Jade City', 'escapist', 5, 500), b('Cosmos', 'ideas', 5, 360), b('In the Dream House', 'memoir', 4, 240)]),
  m(2023, 2, [
    b('The Fifth Season', 'escapist', 5, 470), b('The Code Breaker', 'ideas', 4, 530),
    b('Gathering Moss', 'nature', 5, 170), b('Ghost Empire', 'history', 4, 360),
    b('The Body Keeps Score', 'memoir', 5, 460), b('Leviathan Wakes', 'ideas', 4, 560),
  ]),
  m(2023, 3, [
    b('Throne of Glass 2', 'escapist', 5, 880), b('Left Hand of Darkness', 'ideas', 5, 280),
    b('Silent Spring', 'nature', 5, 380), b('The Anarchy', 'history', 5, 520),
    b('Educated', 'memoir', 5, 330), b('Hyperion', 'escapist', 5, 480),
    b('Isaacson Jobs', 'ideas', 4, 630), b('The Old Man and Sea', 'nature', 4, 130),
    b('Genghis Khan', 'history', 4, 400), b('Between Two Kingdoms', 'memoir', 4, 340),
  ]),
  m(2023, 4, [b('The Priory of Orange Tree', 'escapist', 4, 840), b('Endurance', 'nature', 5, 360)]),
  m(2023, 5, [b('Cloud Cuckoo Land', 'escapist', 5, 620), b('Determined', 'ideas', 4, 510), b('Tara Westover', 'memoir', 5, 330)]),
  m(2023, 6, [b('History surge', 'history', 4, 450), b('Nature retreat', 'nature', 4, 350), b('Once More We Saw Stars', 'memoir', 5, 260)]),
  m(2023, 7, [b('Assassin\'s Apprentice', 'escapist', 4, 430), b('The Master Algorithm', 'ideas', 3, 350)]),
  m(2023, 8, [b('Spinning Silver', 'escapist', 5, 470), b('Range', 'ideas', 4, 340), b('The Moth', 'memoir', 4, 280)]),
  m(2023, 9, [b('Exhalation', 'ideas', 5, 350), b('Beloved', 'escapist', 5, 320), b('Empire Falls', 'history', 4, 480)]),
  m(2023, 10, [b('House in Cerulean Sea', 'escapist', 5, 390), b('Desert Solitaire', 'nature', 5, 290)]),
  m(2023, 11, [b('Warbreaker', 'escapist', 4, 590), b('The Stranger', 'history', 4, 120), b('Heart Berries', 'memoir', 5, 160)]),

  // 2024
  m(2024, 0, [b('History & world', 'history', 4, 400), b('Outline', 'memoir', 4, 250)]),
  m(2024, 1, [b('Stormlight 1', 'escapist', 5, 1000), b('Life 3.0', 'ideas', 4, 360)]),
  m(2024, 2, [
    b('Stormlight 2', 'escapist', 5, 1050), b('Surveillance Valley', 'ideas', 4, 420),
    b('The Sea Around Us', 'nature', 5, 240), b('SPQR', 'history', 4, 290),
    b('Unbroken', 'memoir', 5, 470), b('Elantris', 'escapist', 4, 490),
    b('Noise', 'ideas', 4, 450), b('The Living Mountain', 'nature', 4, 110),
  ]),
  m(2024, 3, [b('Escapist surge', 'escapist', 4, 520), b('Ideas wave', 'ideas', 4, 310), b('A Moveable Feast', 'memoir', 5, 190)]),
  m(2024, 4, [b('The Luminaries', 'escapist', 4, 830), b('Thinking in Systems', 'ideas', 5, 240)]),
  m(2024, 5, [b('Nature month', 'nature', 4, 280), b('All the Light', 'history', 5, 530), b('Just Kids', 'memoir', 5, 280)]),
  m(2024, 6, [b('Main current', 'escapist', 4, 600), b('Nature & ocean', 'nature', 4, 280), b('When Things Fall Apart', 'memoir', 4, 160)]),
  m(2024, 7, [
    b('Earthsea 1', 'escapist', 5, 180), b('Earthsea 2', 'escapist', 5, 200),
    b('Earthsea 3', 'escapist', 4, 220), b('Debt', 'ideas', 4, 540),
    b('Underland', 'nature', 5, 380), b('Fall of Civilizations', 'history', 4, 460),
    b('The Diving Bell', 'memoir', 5, 130), b('Earthsea 4', 'escapist', 4, 250),
    b('Four Thousand Weeks', 'ideas', 4, 280),
  ]),
  m(2024, 8, [b('The Goblin Emperor', 'escapist', 5, 440), b('Pilgrim at Tinker Creek', 'nature', 5, 280)]),
  m(2024, 9, [b('Surge', 'escapist', 5, 700), b('Ideas wave', 'ideas', 4, 340), b('The Argonauts', 'memoir', 4, 140)]),
  m(2024, 10, [b('Jonathan Strange', 'escapist', 5, 780), b('The Gene', 'ideas', 4, 590), b('Long Walk to Freedom', 'memoir', 5, 620)]),
  m(2024, 11, [b('Jade Legacy', 'escapist', 5, 730), b('Meditations', 'history', 5, 180)]),

  // 2025
  m(2025, 0, [b('Nature retreat', 'nature', 5, 300), b('History dive', 'history', 4, 420), b('Norwegian Wood', 'memoir', 4, 290)]),
  m(2025, 1, [b('Tigana', 'escapist', 5, 670), b('The Alignment Problem', 'ideas', 4, 400)]),
  m(2025, 2, [
    b('Realm of Elderlings', 'escapist', 5, 550), b('Scale', 'ideas', 5, 480),
    b('The Peregrine', 'nature', 5, 190), b('Rubicon', 'history', 4, 400),
    b('Crying in H Mart', 'memoir', 5, 240), b('Senlin Ascends', 'escapist', 5, 390),
    b('Superintelligence', 'ideas', 4, 320),
  ]),
  m(2025, 3, [b('The Lions of Al-Rassan', 'escapist', 5, 500), b('The Wager', 'history', 5, 330)]),
  m(2025, 4, [b('Escapist surge', 'escapist', 5, 800), b('Chaos', 'ideas', 4, 370), b('Fun Home', 'memoir', 5, 230)]),
  m(2025, 5, [b('Piranesi', 'escapist', 5, 250), b('H is for Hawk', 'nature', 5, 300)]),
  m(2025, 6, [b('The Lies of Locke Lamora', 'escapist', 5, 720), b('Antifragile', 'ideas', 4, 520), b('Born to Run', 'memoir', 4, 280)]),
  m(2025, 7, [b('Uprooted', 'escapist', 5, 430), b('Ghost Map', 'history', 4, 300)]),
  m(2025, 8, [b('Ideas bloom', 'ideas', 5, 400), b('Ocean stories', 'nature', 4, 320), b('Wave', 'memoir', 5, 230)]),
  m(2025, 9, [b('Autumn reads', 'escapist', 4, 350), b('Sapiens recap', 'ideas', 4, 440)]),
  m(2025, 10, [b('The Name of the Rose', 'history', 5, 500), b('Winterkeep', 'escapist', 4, 430)]),
  m(2025, 11, [b('Year end', 'escapist', 4, 300), b('Nature close', 'nature', 4, 260), b('Tiny Beautiful Things', 'memoir', 4, 260)]),

  // 2026
  m(2026, 0, [b('New year reads', 'escapist', 4, 350), b('Tech future', 'ideas', 4, 280), b('Smoke Gets in Your Eyes', 'memoir', 4, 270)]),
  m(2026, 1, [b('Winter tales', 'escapist', 4, 290), b('The Warmth of Other Suns', 'history', 5, 620)]),
  m(2026, 2, [b('Spring reading', 'nature', 4, 220), b('The Dispossessed', 'ideas', 5, 340)]),
];

export const totalPages = (d: MonthData) => d.books.reduce((a, b) => a + b.pages, 0);

export const avgRating = (d: MonthData) => {
  if (d.books.length === 0) return 0;
  return d.books.reduce((a, b) => a + b.rating, 0) / d.books.length;
};

export const getYears = () => [...new Set(readingData.map(d => d.year))].sort();

export const toMonthIndex = (d: MonthData) => (d.year - 2021) * 12 + d.month;
