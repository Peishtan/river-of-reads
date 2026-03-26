export type VibeGroup = 'escapist' | 'ideas' | 'nature' | 'history' | 'life' | 'current';

export const VIBES: VibeGroup[] = ['escapist', 'ideas', 'current', 'nature', 'history', 'life'];

export const vibeLabels: Record<VibeGroup, string> = {
  escapist: 'Escapist & Adventure',
  ideas: 'Ideas & Technology',
  nature: 'Nature & Ocean',
  history: 'History & World',
  life: 'Life & Reflective',
  current: 'The Main Current',
};

export const defaultVibeHSL: Record<VibeGroup, string> = {
  nature:   'hsl(170, 35%, 38%)',   // The Wild — Deeper Teal
  history:  'hsl(220, 55%, 52%)',   // The World — Bright Blue
  ideas:    'hsl(250, 25%, 58%)',   // The Lab — Muted Lavender (was slate blue, now distinct)
  escapist: 'hsl(18, 50%, 50%)',    // The Escape — Terracotta
  life:     'hsl(85, 25%, 48%)',    // The Hearth — Olive/Yellow-Green (was sage, now warmer)
  current:  'hsl(210, 22%, 24%)',   // The Main Current — Deep Slate
};

// Kept as mutable reference that can be overridden by river settings
export let vibeHSL: Record<VibeGroup, string> = { ...defaultVibeHSL };

export const setVibeHSL = (colors: Record<VibeGroup, string>) => {
  vibeHSL = { ...colors };
};

/** Map raw tag strings to vibe groups */
export const TAG_TO_VIBE: Record<string, VibeGroup> = {
  // Escapist & Adventure
  adventure: 'escapist', bleak: 'escapist', dark: 'escapist',
  dystopian: 'escapist', escapist: 'escapist', mystery: 'escapist',
  thriller: 'escapist', uncomfortable: 'escapist',
  // Ideas & Technology
  business: 'ideas', craft: 'ideas', future: 'ideas', 'idea-dense': 'ideas',
  practical: 'ideas', science: 'ideas', systems: 'ideas', technology: 'ideas',
  // History & World
  culture: 'history', food: 'history', history: 'history', legal: 'history',
  literary: 'history', politics: 'history', travel: 'history',
  // Nature & Ocean
  nature: 'nature',
  // Life & Reflective
  hope: 'life', memoir: 'life', 'philosophy-lite': 'life',
  psychology: 'life', reflective: 'life', warm: 'life',
};

export function tagsToVibes(tagString: string): VibeGroup[] {
  const tags = tagString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const vibeSet = new Set<VibeGroup>();
  for (const tag of tags) {
    const vibe = TAG_TO_VIBE[tag];
    if (vibe) vibeSet.add(vibe);
  }
  return vibeSet.size > 0 ? Array.from(vibeSet) : ['current']; // default to Main Current
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

export const totalPages = (d: MonthData) => d.books.reduce((s, b) => s + b.pages, 0);
export const avgRating = (d: MonthData) => {
  if (d.books.length === 0) return 0;
  return d.books.reduce((s, b) => s + b.rating, 0) / d.books.length;
};

// Real reading data — tagged books from 2021 onwards

// Reading data from CSV — 563 books
export const readingData: MonthData[] = [
  m(2012, 11, [
    b('The Night Circus', 'current', 5, 250, 'Erin Morgenstern'),
  ]),
  m(2013, 0, [
    b('A World Undone: The Story of the Great War, 1914 to 1918', 'current', 3, 250, 'G.J. Meyer'),
  ]),
  m(2013, 1, [
    b('Brideshead Revisited', 'current', 3, 250, 'Evelyn Waugh'),
    b('Behind the Beautiful Forevers: Life, Death, and Hope in a Mumbai Undercity', 'current', 4, 250, 'Katherine Boo'),
  ]),
  m(2013, 2, [
    b('Wool Omnibus (Silo, #1)', 'current', 4, 250, 'Hugh Howey'),
    b('Sealab: America\'s Forgotten Quest to Live and Work on the Ocean Floor', 'current', 5, 250, 'Ben Hellwarth'),
    b('Lean In: Women, Work, and the Will to Lead', 'current', 4, 250, 'Sheryl Sandberg'),
  ]),
  m(2013, 3, [
    b('Blind Man\'s Bluff: The Untold Story of American Submarine Espionage', 'current', 5, 250, 'Sherry Sontag'),
    b('The Time of Our Singing', 'current', 5, 250, 'Richard Powers'),
  ]),
  m(2015, 0, [
    b('Call Me Debbie: True Confessions of a Down-to-Earth Diva', 'current', 3, 250, 'Deborah Voigt'),
  ]),
  m(2015, 1, [
    b('Lamentation (Matthew Shardlake, #6)', 'current', 5, 250, 'C.J. Sansom'),
    b('The Sense of an Ending', 'current', 4, 250, 'Julian Barnes'),
    b('War of the Whales: A True Story', 'current', 5, 250, 'Joshua Horwitz'),
    b('Maestro', 'current', 5, 250, 'Peter Goldsworthy'),
  ]),
  m(2015, 2, [
    b('My Life in France', 'current', 5, 250, 'Julia Child'),
    b('Death at La Fenice (Commissario Brunetti, #1)', 'current', 3, 250, 'Donna Leon'),
    b('The Singapore Story: Memoirs of Lee Kuan Yew', 'current', 5, 250, 'Lee Kuan Yew'),
    b('The Color of Tea', 'current', 5, 250, 'Hannah Tunnicliffe'),
  ]),
  m(2015, 4, [
    b('Ashley\'s War: The Untold Story of a Team of Women Soldiers on the Special Ops Battlefield', 'current', 5, 250, 'Gayle Tzemach Lemmon'),
  ]),
  m(2015, 5, [
    b('Web Analytics 2.0: The Art of Online Accountability and Science of Customer Centricity', 'current', 5, 250, 'Avinash Kaushik'),
    b('The Code Book: The Science of Secrecy from Ancient Egypt to Quantum Cryptography', 'current', 5, 250, 'Simon Singh'),
    b('Business Model Generation', 'current', 4, 250, 'Alexander Osterwalder'),
  ]),
  m(2015, 6, [
    b('China Rich Girlfriend (Crazy Rich Asians, #2)', 'current', 3, 250, 'Kevin Kwan'),
    b('Sovereign (Matthew Shardlake, #3)', 'current', 5, 250, 'C.J. Sansom'),
    b('Outliers: The Story of Success', 'current', 3, 250, 'Malcolm Gladwell'),
    b('Boomerang: Travels in the New Third World', 'current', 4, 250, 'Michael Lewis'),
  ]),
  m(2015, 7, [
    b('The Girl on the Train', 'current', 5, 250, 'Paula Hawkins'),
  ]),
  m(2015, 8, [
    b('The Girl in the Spider\'s Web (Millennium, #4)', 'current', 4, 250, 'David Lagercrantz'),
  ]),
  m(2015, 9, [
    b('None of Your Business', 'current', 2, 250, 'Valerie Block'),
    b('Trail of Broken Wings', 'current', 3, 250, 'Sejal Badani'),
    b('The Nightingale', 'current', 4, 250, 'Kristin Hannah'),
  ]),
  m(2015, 10, [
    b('Fearless: One Woman, One Kayak, One Continent', 'current', 4, 250, 'Joe Glickman'),
    b('Career of Evil (Cormoran Strike, #3)', 'current', 3, 250, 'Robert Galbraith'),
  ]),
  m(2015, 11, [
    b('History of English Poetry', 'current', 4, 250, 'Peter Whitfield'),
  ]),
  m(2016, 0, [
    b('Elon Musk: Tesla, SpaceX, and the Quest for a Fantastic Future', 'current', 4, 250, 'Ashlee Vance'),
    b('The Everything Store: Jeff Bezos and the Age of Amazon', 'current', 5, 250, 'Brad Stone'),
    b('The Road to Character', 'current', 2, 250, 'David Brooks'),
    b('An Astronaut\'s Guide to Life on Earth', 'current', 5, 250, 'Chris Hadfield'),
    b('The Virgin Way: Everything I Know About Leadership', 'current', 4, 250, 'Richard Branson'),
  ]),
  m(2016, 9, [
    b('Sapiens: A Brief History of Humankind', 'current', 5, 250, 'Yuval Noah Harari'),
  ]),
  m(2019, 3, [
    b('Misbehaving: The Making of Behavioral Economics', 'current', 5, 250, 'Richard H. Thaler'),
  ]),
  m(2020, 0, [
    b('Blazing Paddles: A Scottish Coastal Odyssey', 'current', 3, 250, 'Brian Wilson'),
    b('Maid: Hard Work, Low Pay, and a Mother\'s Will to Survive', 'current', 3, 250, 'Stephanie Land'),
    b('The Reluctant Fundamentalist', 'current', 3, 250, 'Mohsin Hamid'),
    b('The Ten Thousand Doors of January', 'current', 5, 250, 'Alix E. Harrow'),
    b('That Will Never Work: The Birth of Netflix and the Amazing Life of an Idea', 'current', 5, 250, 'Marc Randolph'),
    b('Eleanor Oliphant Is Completely Fine', 'current', 3, 250, 'Gail Honeyman'),
  ]),
  m(2020, 1, [
    b('Circe', 'current', 4, 250, 'Madeline Miller'),
    b('Legend (The Drenai Saga, #1)', 'current', 4, 250, 'David Gemmell'),
    b('The King Beyond the Gate (The Drenai Saga, #2)', 'current', 3, 250, 'David Gemmell'),
  ]),
  m(2020, 2, [
    b('Whistleblower: My Journey to Silicon Valley and Fight for Justice at Uber', 'current', 5, 250, 'Susan Fowler'),
    b('Soldier Spy', 'current', 5, 250, 'Tom Marcus'),
    b('Everybody Lies: Big Data, New Data, and What the Internet Can Tell Us About Who We Really Are', 'current', 3, 250, 'Seth Stephens-Davidowitz'),
    b('How We Disappeared', 'current', 5, 250, 'Jing-Jing Lee'),
    b('Disrupted: My Misadventure in the Start-Up Bubble', 'current', 3, 250, 'Dan Lyons'),
  ]),
  m(2020, 3, [
    b('Inspired: How To Create Products Customers Love', 'current', 4, 250, 'Marty Cagan'),
    b('Hooked: How to Build Habit-Forming Products', 'current', 4, 250, 'Nir Eyal'),
    b('The Silent Patient', 'current', 4, 250, 'Alex Michaelides'),
    b('State of Emergency', 'current', 3, 250, 'Jeremy Tiang'),
    b('Sugarbread', 'current', 3, 250, 'Balli Kaur Jaswal'),
    b('The Sky Is Everywhere', 'current', 3, 250, 'Jandy Nelson'),
  ]),
  m(2020, 4, [
    b('Into the Planet: My Life as a Cave Diver', 'current', 5, 250, 'Jill Heinerth'),
    b('The Truffle Underground: A Tale of Mystery, Mayhem, and Manipulation in the Shadowy Market of the World\'s Most Expensive Fungus', 'current', 4, 250, 'Ryan Jacobs'),
    b('The Lesson', 'current', 3, 250, 'Cadwell Turnbull'),
    b('Lands of Lost Borders: A Journey on the Silk Road', 'current', 5, 250, 'Kate Harris'),
    b('Never Split the Difference: Negotiating As If Your Life Depended On It', 'current', 5, 250, 'Chris Voss'),
    b('The Ballad of Songbirds and Snakes (The Hunger Games, #0)', 'current', 5, 250, 'Suzanne Collins'),
  ]),
  m(2020, 5, [
    b('Recursion', 'current', 4, 250, 'Blake Crouch'),
    b('The Ride of a Lifetime: Lessons Learned from 15 Years as CEO of the Walt Disney Company', 'current', 5, 250, 'Robert Iger'),
    b('The Unexpected Spy: From the CIA to the FBI, My Secret Life Taking Down Some of the World\'s Most Notorious Terrorists', 'current', 3, 250, 'Tracy Walder'),
    b('The Well of Ascension (Mistborn, #2)', 'current', 5, 250, 'Brandon Sanderson'),
    b('The Hero of Ages (Mistborn, #3)', 'current', 5, 250, 'Brandon Sanderson'),
    b('The Alloy of Law (Mistborn, #4)', 'current', 4, 250, 'Brandon Sanderson'),
    b('Shadows of Self (Mistborn, #5)', 'current', 4, 250, 'Brandon Sanderson'),
  ]),
  m(2020, 6, [
    b('The Bands of Mourning (Mistborn, #6)', 'current', 3, 250, 'Brandon Sanderson'),
    b('Can\'t Hurt Me: Master Your Mind and Defy the Odds', 'current', 4, 250, 'David Goggins'),
    b('The Family Upstairs (The Family Upstairs, #1)', 'current', 3, 250, 'Lisa Jewell'),
    b('The Expatriates', 'current', 3, 250, 'Janice Y.K. Lee'),
    b('Sex and Vanity', 'current', 1, 250, 'Kevin Kwan'),
  ]),
  m(2020, 7, [
    b('The Giver of Stars', 'current', 5, 250, 'Jojo Moyes'),
    b('Before the Coffee Gets Cold', 'current', 4, 250, 'Toshikazu Kawaguchi'),
    b('Before the Coffee Gets Cold (Before the Coffee Gets Cold, #1)', 'current', 1, 250, 'Toshikazu Kawaguchi'),
    b('Last Tang Standing', 'current', 3, 250, 'Lauren Ho'),
    b('The Jetsetters', 'current', 4, 250, 'Amanda Eyre Ward'),
  ]),
  m(2020, 8, [
    b('Alexander Hamilton', 'current', 5, 250, 'Ron Chernow'),
    b('Lafayette', 'current', 4, 250, 'Harlow Giles Unger'),
    b('Rage', 'current', 4, 250, 'Bob Woodward'),
  ]),
  m(2020, 9, [
    b('Eliza Hamilton: The Extraordinary Life and Times of the Wife of Alexander Hamilton', 'current', 3, 250, 'Tilar J. Mazzeo'),
    b('The Midnight Library', 'current', 4, 250, 'Matt Haig'),
    b('The Truths We Hold: An American Journey', 'current', 4, 250, 'Kamala Harris'),
  ]),
  m(2020, 10, [
    b('Just Mercy', 'current', 5, 250, 'Bryan Stevenson'),
    b('A More Beautiful Question: The Power of Inquiry to Spark Breakthrough Ideas', 'current', 4, 250, 'Warren Berger'),
    b('The Guest List', 'current', 4, 250, 'Lucy Foley'),
  ]),
  m(2020, 11, [
    b('A Promised Land', 'current', 5, 250, 'Barack Obama'),
    b('Eat a Peach', 'current', 5, 250, 'David Chang'),
    b('American Dirt', 'current', 5, 250, 'Jeanine Cummins'),
    b('The Vanishing Half', 'current', 5, 250, 'Brit Bennett'),
    b('The Henna Artist (The Jaipur Trilogy, #1)', 'current', 4, 250, 'Alka Joshi'),
    b('The Book of Lost Names', 'current', 5, 250, 'Kristin Harmel'),
    b('Invisible Women: Data Bias in a World Designed for Men', 'current', 5, 250, 'Caroline Criado Perez'),
    b('Homeland Elegies', 'current', 5, 250, 'Ayad Akhtar'),
  ]),
  m(2021, 0, [
    b('Caste: The Origins of Our Discontents', ['history', 'ideas', 'escapist'], 4, 250, 'Isabel Wilkerson'),
    b('The Paper Daughters of Chinatown', ['history', 'life'], 3, 250, 'Heather B. Moore'),
    b('Beach Read', ['escapist', 'life'], 3, 250, 'Emily Henry'),
    b('Ready Player Two (Ready Player One, #2)', ['escapist', 'ideas'], 2, 250, 'Ernest Cline'),
    b('The Poisonwood Bible', ['escapist', 'history', 'life'], 4, 250, 'Barbara Kingsolver'),
  ]),
  m(2021, 1, [
    b('Rhythm of War (The Stormlight Archive, #4)', ['escapist', 'ideas'], 4, 250, 'Brandon Sanderson'),
    b('The Riot Act', 'history', 3, 250, 'Sebastian Sim'),
    b('The House in the Cerulean Sea (Cerulean Chronicles, #1)', ['escapist', 'life'], 5, 250, 'T.J. Klune'),
    b('Black Buck', ['history', 'escapist'], 3, 250, 'Mateo Askaripour'),
    b('The Invisible Life of Addie LaRue', ['escapist', 'life'], 5, 250, 'V.E. Schwab'),
    b('The House of the Spirits', ['history', 'life'], 4, 250, 'Isabel Allende'),
    b('The Three-Body Problem (Remembrance of Earth\'s Past, #1)', 'ideas', 3, 250, 'Liu Cixin'),
  ]),
  m(2021, 2, [
    b('High Output Management', 'ideas', 4, 250, 'Andrew S. Grove'),
    b('The Good Life: Up the Yukon Without a Paddle', ['escapist', 'nature', 'life'], 4, 250, 'Dorian Amos'),
    b('Drive: The Surprising Truth About What Motivates Us', 'ideas', 4, 250, 'Daniel H. Pink'),
    b('Range: Why Generalists Triumph in a Specialized World', 'ideas', 5, 250, 'David Epstein'),
    b('Then We Came to the End', ['history', 'escapist', 'life'], 3, 250, 'Joshua Ferris'),
    b('Piranesi', ['life', 'escapist'], 3, 250, 'Susanna Clarke'),
    b('The Thursday Murder Club (Thursday Murder Club, #1)', ['escapist', 'life'], 4, 250, 'Richard Osman'),
    b('The Code Breaker: Jennifer Doudna, Gene Editing, and the Future of the Human Race', ['history', 'ideas'], 3, 250, 'Walter Isaacson'),
    b('Radical Candor: Be a Kickass Boss Without Losing Your Humanity', 'ideas', 5, 250, 'Kim Malone Scott'),
  ]),
  m(2021, 3, [
    b('Working Backwards: Insights, Stories, and Secrets from Inside Amazon', 'ideas', 4, 250, 'Colin Bryar'),
    b('The Lost Apothecary', ['history', 'escapist'], 4, 250, 'Sarah Penner'),
    b('Free Food for Millionaires', ['history', 'life'], 3, 250, 'Min Jin Lee'),
    b('The Dictionary of Lost Words', ['history', 'life'], 5, 250, 'Pip Williams'),
    b('Think Again: The Power of Knowing What You Don\'t Know', 'ideas', 3, 250, 'Adam M. Grant'),
    b('So You Want to Talk About Race', ['history', 'ideas'], 4, 250, 'Ijeoma Oluo'),
    b('Station Eleven', ['escapist', 'life'], 4, 250, 'Emily St. John Mandel'),
  ]),
  m(2021, 4, [
    b('The Kitchen Front', ['life', 'history'], 4, 250, 'Jennifer Ryan'),
    b('The Women of Chateau Lafayette', 'history', 4, 250, 'Stephanie Dray'),
    b('The Last Bookshop in London', ['history', 'life'], 5, 250, 'Madeline Martin'),
    b('The Splendid and the Vile: A Saga of Churchill, Family, and Defiance During the Blitz', ['escapist', 'history', 'life'], 5, 250, 'Erik Larson'),
    b('The Glass Hotel', ['escapist', 'life'], 3, 250, 'Emily St. John Mandel'),
    b('The Four Winds', ['escapist', 'history', 'life'], 5, 250, 'Kristin Hannah'),
    b('Swell: A Sailing Surfer\'s Voyage of Awakening', ['escapist', 'nature', 'life'], 4, 250, 'Liz Clark'),
    b('Murder on the Orient Express (Hercule Poirot, #10)', 'escapist', 4, 250, 'Agatha Christie'),
    b('The Wave: In Pursuit of the Rogues, Freaks, and Giants of the Ocean', ['escapist', 'nature', 'ideas'], 4, 250, 'Susan Casey'),
    b('The Dawn Patrol (Boone Daniels #1)', 'escapist', 3, 250, 'Don Winslow'),
    b('Minor Feelings: An Asian American Reckoning', ['history', 'life', 'escapist'], 4, 250, 'Cathy Park Hong'),
  ]),
  m(2021, 5, [
    b('One Breath: Freediving, Death, and the Quest to Shatter Human Limits', ['escapist', 'nature'], 5, 250, 'Adam Skolnick'),
    b('The Rose Code', ['escapist', 'history', 'life'], 5, 250, 'Kate Quinn'),
    b('The Girl Who Drew Butterflies: How Maria Merian\'s Art Changed Science', ['history', 'nature', 'ideas'], 4, 250, 'Joyce Sidman'),
    b('The Seven Husbands of Evelyn Hugo', ['history', 'escapist', 'life'], 5, 250, 'Taylor Jenkins Reid'),
    b('Troubled Blood (Cormoran Strike, #5)', 'escapist', 5, 250, 'Robert Galbraith'),
    b('The Sound of Gravel', 'escapist', 3, 250, 'Ruth Wariner'),
    b('Lights Out: Pride, Delusion, and the Fall of General Electric', ['ideas', 'history', 'escapist'], 3, 250, 'Thomas Gryta'),
  ]),
  m(2021, 6, [
    b('If the Oceans Were Ink: An Unlikely Friendship and a Journey to the Heart of the Quran', ['history', 'life'], 3, 250, 'Carla Power'),
    b('Every Last Fear', 'escapist', 4, 250, 'Alex Finlay'),
    b('Gold Diggers', ['history', 'life', 'escapist'], 3, 250, 'Sanjena Sathian'),
    b('The Other Black Girl', ['history', 'escapist'], 4, 250, 'Zakiya Dalila Harris'),
    b('Her Last Flight', ['escapist', 'history'], 3, 250, 'Beatriz Williams'),
    b('The Last Thing He Told Me (Hannah Hall, #1)', 'escapist', 5, 250, 'Laura Dave'),
    b('Uncanny Valley', ['history', 'life', 'ideas'], 4, 250, 'Anna Wiener'),
    b('Project Hail Mary', ['escapist', 'ideas'], 5, 250, 'Andy Weir'),
    b('Brotopia: Breaking Up the Boys\' Club of Silicon Valley', ['ideas', 'history', 'escapist'], 4, 250, 'Emily Chang'),
    b('Deep: Freediving, Renegade Science, and What the Ocean Tells Us About Ourselves', ['escapist', 'nature', 'ideas'], 5, 250, 'James Nestor'),
    b('Klara and the Sun', ['ideas', 'life'], 4, 250, 'Kazuo Ishiguro'),
    b('The Women of Chateau Lafayette', 'current', 4, 250, 'Stephanie Dray'),
  ]),
  m(2021, 7, [
    b('The One Hundred Years of Lenni and Margot', 'life', 4, 250, 'Marianne Cronin'),
    b('Such a Fun Age', ['history', 'life', 'escapist'], 4, 250, 'Kiley Reid'),
    b('The Last Bookshop in London', 'current', 4, 250, 'Madeline Martin'),
    b('People We Meet on Vacation', ['escapist', 'life'], 5, 250, 'Emily Henry'),
    b('The Glass Hotel', 'current', 4, 250, 'Emily St. John Mandel'),
    b('Home Fire', ['escapist', 'life', 'history'], 3, 250, 'Kamila Shamsie'),
    b('The Four Winds', 'current', 5, 250, 'Kristin Hannah'),
    b('Crying in H Mart', ['history', 'life'], 5, 250, 'Michelle Zauner'),
    b('Drive: The Surprising Truth About What Motivates Us', 'current', 4, 250, 'Daniel H. Pink'),
    b('A Thousand Ships', ['history', 'life'], 3, 250, 'Natalie Haynes'),
    b('Range: Why Generalists Triumph in a Specialized World', 'current', 4, 250, 'David Epstein'),
  ]),
  m(2021, 8, [
    b('Malibu Rising', ['history', 'escapist', 'life'], 5, 250, 'Taylor Jenkins Reid'),
    b('Then We Came to the End', 'current', 4, 250, 'Joshua Ferris'),
    b('The Code Breaker: Jennifer Doudna, Gene Editing, and the Future of the Human Race', 'current', 4, 250, 'Walter Isaacson'),
    b('Radical Candor: Be a Kickass Boss Without Losing Your Humanity', 'current', 5, 250, 'Kim Malone Scott'),
    b('Working Backwards: Insights, Stories, and Secrets from Inside Amazon', 'current', 4, 250, 'Colin Bryar'),
    b('Free Food for Millionaires', 'current', 4, 250, 'Min Jin Lee'),
  ]),
  m(2021, 9, [
    b('The Dictionary of Lost Words', 'current', 4, 250, 'Pip Williams'),
    b('Station Eleven', 'current', 5, 250, 'Emily St. John Mandel'),
    b('Swell: A Sailing Surfer\'s Voyage of Awakening', 'current', 4, 250, 'Liz Clark'),
    b('The Dawn Patrol (Boone Daniels #1)', 'current', 4, 250, 'Don Winslow'),
    b('The Rose Code', 'current', 5, 250, 'Kate Quinn'),
    b('One Breath: Freediving, Death, and the Quest to Shatter Human Limits', 'current', 4, 250, 'Adam Skolnick'),
    b('Troubled Blood (Cormoran Strike, #5)', 'current', 4, 250, 'Robert Galbraith'),
    b('Lights Out: Pride, Delusion, and the Fall of General Electric', 'current', 4, 250, 'Thomas Gryta'),
    b('If the Oceans Were Ink: An Unlikely Friendship and a Journey to the Heart of the Quran', 'current', 4, 250, 'Carla Power'),
  ]),
  m(2021, 10, [
    b('Every Last Fear', 'current', 4, 250, 'Alex Finlay'),
    b('Gold Diggers', 'current', 4, 250, 'Sanjena Sathian'),
    b('The Other Black Girl', 'current', 4, 250, 'Zakiya Dalila Harris'),
    b('Her Last Flight', 'current', 3, 250, 'Beatriz Williams'),
    b('The One Hundred Years of Lenni and Margot', 'current', 5, 250, 'Marianne Cronin'),
    b('People We Meet on Vacation', 'current', 4, 250, 'Emily Henry'),
    b('How to Talk to Anyone: 92 Little Tricks for Big Success in Relationships', 'ideas', 3, 250, 'Leil Lowndes'),
    b('Home Fire', 'current', 5, 250, 'Kamila Shamsie'),
    b('A Thousand Ships', 'current', 4, 250, 'Natalie Haynes'),
    b('The Bestseller', 'current', 3, 250, 'Olivia Goldsmith'),
  ]),
  m(2021, 11, [
    b('Extreme Ownership: How U.S. Navy SEALs Lead and Win', 'current', 4, 250, 'Jocko Willink'),
    b('The Happy Isles of Oceania: Paddling the Pacific', 'current', 4, 250, 'Paul Theroux'),
    b('The Vixen', 'current', 3, 250, 'Francine Prose'),
    b('The Power Couple', 'current', 3, 250, 'Alex Berenson'),
    b('Building a StoryBrand: Clarify Your Message So Customers Will Listen', 'ideas', 3, 250, 'Donald Miller'),
    b('The Ghost War (John Wells, #2)', 'current', 3, 250, 'Alex Berenson'),
    b('Down a Dark Road (Kate Burkholder, #9)', 'current', 4, 250, 'Linda Castillo'),
    b('The Personal Librarian', 'current', 4, 250, 'Marie Benedict'),
    b('The Silent Man (John Wells, #3)', 'current', 3, 250, 'Alex Berenson'),
  ]),
  m(2022, 0, [
    b('Empire of Pain: The Secret History of the Sackler Dynasty', 'current', 5, 250, 'Patrick Radden Keefe'),
    b('The Apollo Murders (Apollo Murders, #1)', 'current', 4, 250, 'Chris Hadfield'),
    b('Red Notice: A True Story of High Finance, Murder, and One Man\'s Fight for Justice', 'current', 5, 250, 'Bill Browder'),
    b('How to Be a Bawse: A Guide to Conquering Life', 'current', 3, 250, 'Lilly Singh'),
    b('The Cold Start Problem: How to Start and Scale Network Effects', 'current', 4, 250, 'Andrew Chen'),
    b('The Nile: A Journey Downriver Through Egypt\'s Past and Present', ['history', 'nature'], 3, 250, 'Toby Wilkinson'),
    b('The Reading List', 'current', 4, 250, 'Sara Nisha Adams'),
    b('Madhouse at the End of the Earth: The Belgica\'s Journey into the Dark Antarctic Night', 'current', 5, 250, 'Julian Sancton'),
    b('Bluebird', 'current', 4, 250, 'Sharon Cameron'),
    b('A Deadly Education (The Scholomance, #1)', 'current', 4, 250, 'Naomi Novik'),
    b('The Last Graduate (The Scholomance, #2)', 'current', 4, 250, 'Naomi Novik'),
    b('Walking the Nile', ['escapist', 'nature'], 3, 250, 'Levison Wood'),
  ]),
  m(2022, 1, [
    b('Red Roulette: An Insider\'s Story of Wealth, Power, Corruption, and Vengeance in Today\'s China', 'current', 5, 250, 'Desmond Shum'),
    b('Dial A for Aunties (Aunties, #1)', 'current', 3, 250, 'Jesse Q. Sutanto'),
    b('Beautiful Country', 'current', 5, 250, 'Qian Julie Wang'),
    b('Crocodile on the Sandbank (Amelia Peabody, #1)', ['escapist', 'history'], 4, 250, 'Elizabeth Peters'),
    b('The End of Men', 'current', 4, 250, 'Christina Sweeney-Baird'),
    b('Impact Players: How to Take the Lead, Play Bigger, and Multiply Your Impact', 'ideas', 4, 250, 'Liz Wiseman'),
    b('Customer Success: How Innovative Companies Are Reducing Churn and Growing Recurring Revenue', 'current', 3, 250, 'Nick Mehta'),
  ]),
  m(2022, 2, [
    b('The Customer Success Professional\'s Handbook', 'current', 3, 250, 'Ashvin Vaidyanathan'),
    b('The Multiplier Effect: Tapping the Genius Inside Our Schools', 'ideas', 3, 250, 'Liz Wiseman'),
    b('The Slap', 'current', 3, 250, 'Christos Tsiolkas'),
    b('The Pilot\'s Daughter', ['history', 'escapist'], 3, 250, 'Meredith Jaeger'),
    b('Heartbreak: A Personal and Scientific Journey', 'current', 4, 250, 'Florence Williams'),
    b('The Weekend Away', 'current', 4, 250, 'Sarah Alderson'),
    b('The Memoirs of Cleopatra', ['history', 'life'], 4, 250, 'Margaret George'),
    b('Start with Why: How Great Leaders Inspire Everyone to Take Action', 'current', 4, 250, 'Simon Sinek'),
  ]),
  m(2022, 3, [
    b('The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics', ['escapist', 'history', 'life'], 5, 250, 'Daniel James Brown'),
    b('One Two Three', 'current', 4, 250, 'Laurie Frankel'),
    b('Firekeeper\'s Daughter (Firekeeper\'s Daughter, #1)', 'current', 5, 250, 'Angeline Boulley'),
    b('How To Raise Successful People: Simple Lessons for Radical Results', 'current', 3, 250, 'Esther Wojcicki'),
    b('The Paris Library', 'current', 4, 250, 'Janet Skeslien Charles'),
    b('The Lager Queen of Minnesota', 'current', 4, 250, 'J. Ryan Stradal'),
    b('The Advantage: Why Organizational Health Trumps Everything Else In Business', 'current', 4, 250, 'Patrick Lencioni'),
    b('Severance', 'current', 3, 250, 'Ling Ma'),
  ]),
  m(2022, 4, [
    b('The Writing of the Gods: The Race to Decode the Rosetta Stone', ['history', 'ideas'], 4, 250, 'Edward Dolnick'),
    b('The Leavers', 'current', 4, 250, 'Lisa Ko'),
    b('The Killing Moon (Dreamblood, #1)', 'escapist', 4, 250, 'N.K. Jemisin'),
    b('Grit: The Power of Passion and Perseverance', 'current', 4, 250, 'Angela Duckworth'),
    b('Verity', 'current', 5, 250, 'Colleen Hoover'),
    b('The Shadowed Sun (Dreamblood, #2)', 'escapist', 4, 250, 'N.K. Jemisin'),
    b('Ten Steps to Nanette', 'current', 5, 250, 'Hannah Gadsby'),
    b('Row for Freedom: Crossing an Ocean in Search of Hope', 'current', 3, 250, 'Julia Immonen'),
    b('The Match (Wilde, #2)', 'current', 3, 250, 'Harlan Coben'),
    b('The Five Dysfunctions of a Team', 'current', 4, 250, 'Patrick Lencioni'),
  ]),
  m(2022, 5, [
    b('Dark Matter', 'current', 4, 250, 'Blake Crouch'),
    b('Red Rising (Red Rising Saga, #1)', 'escapist', 5, 250, 'Pierce Brown'),
    b('Unmasked: My Life Solving America\'s Cold Cases', 'escapist', 4, 250, 'Paul Holes'),
    b('The Lincoln Lawyer (The Lincoln Lawyer, #1)', 'current', 4, 250, 'Michael Connelly'),
    b('We Should All Be Feminists', 'current', 5, 250, 'Chimamanda Ngozi Adichie'),
    b('Lessons in Chemistry', 'current', 5, 250, 'Bonnie Garmus'),
    b('The Secret Keeper of Jaipur (The Jaipur Trilogy, #2)', ['history', 'life'], 4, 250, 'Alka Joshi'),
    b('Golden Son (Red Rising Saga, #2)', 'escapist', 5, 250, 'Pierce Brown'),
    b('Morning Star (Red Rising Saga, #3)', 'escapist', 5, 250, 'Pierce Brown'),
    b('The Diamond Eye', 'current', 5, 250, 'Kate Quinn'),
  ]),
  m(2022, 6, [
    b('Peach Blossom Spring', 'current', 4, 250, 'Melissa Fu'),
    b('Happiness for Beginners', ['escapist', 'life'], 4, 250, 'Katherine Center'),
    b('One Italian Summer', 'current', 3, 250, 'Rebecca Serle'),
    b('Hello Darkness, My Old Friend', 'current', 4, 250, 'Sanford D. Greenberg'),
    b('The Family Chao', 'current', 3, 250, 'Lan Samantha Chang'),
    b('Iron Gold (Red Rising Saga, #4)', 'escapist', 4, 250, 'Pierce Brown'),
    b('The Puzzler: One Man\'s Quest to Solve the Most Baffling Puzzles Ever', 'current', 3, 250, 'A.J. Jacobs'),
    b('Sea of Tranquility', 'current', 4, 250, 'Emily St. John Mandel'),
  ]),
  m(2022, 7, [
    b('Agent Sonya: Moscow\'s Most Daring Wartime Spy', 'current', 5, 250, 'Ben Macintyre'),
    b('Great Circle', 'current', 5, 250, 'Maggie Shipstead'),
    b('The Candy House', 'current', 3, 250, 'Jennifer Egan'),
    b('Nora Goes Off Script', 'current', 4, 250, 'Annabel Monaghan'),
    b('The Song of Achilles', 'current', 5, 250, 'Madeline Miller'),
    b('The Snow Child', 'current', 4, 250, 'Eowyn Ivey'),
    b('Good Morning, Midnight', ['escapist', 'life'], 3, 250, 'Lily Brooks-Dalton'),
    b('Stolen Focus: Why You Can\'t Pay Attention—and How to Think Deeply Again', 'current', 4, 250, 'Johann Hari'),
  ]),
  m(2022, 8, [
    b('The Terminal List (Terminal List, #1)', 'current', 4, 250, 'Jack Carr'),
    b('The Last True Poets of the Sea', 'current', 4, 250, 'Julia Drake'),
    b('The Making of a Manager: What to Do When Everyone Looks to You', 'current', 5, 250, 'Julie Zhuo'),
    b('The It Girl', 'current', 4, 250, 'Ruth Ware'),
    b('The Power', ['history', 'escapist'], 4, 250, 'Naomi Alderman'),
    b('Bloomsbury Girls (Jane Austen Society, #2)', 'current', 3, 250, 'Natalie Jenner'),
    b('Laws of UX: Using Psychology to Design Better Products & Services', 'ideas', 4, 250, 'Jon Yablonski'),
    b('Hacking Growth: How Today\'s Fastest-Growing Companies Drive Breakout Success', 'current', 3, 250, 'Sean Ellis'),
    b('Migrations', 'current', 4, 250, 'Charlotte McConaghy'),
  ]),
  m(2022, 9, [
    b('Are You There God? It\'s Me, Margaret', ['history', 'life'], 3, 250, 'Judy Blume'),
    b('The Librarian Spy', 'current', 4, 250, 'Madeline Martin'),
    b('The Power of Moments: Why Certain Experiences Have Extraordinary Impact', 'current', 4, 250, 'Chip Heath'),
    b('Take Back Your Power: 10 New Rules for Women at Work', 'current', 4, 250, 'Deborah Liu'),
    b('The Mom Test: How to talk to customers & learn if your business is a good idea when everyone is lying to you', 'ideas', 4, 250, 'Rob Fitzpatrick'),
    b('The Geography of Genius: A Search for the World\'s Most Creative Places from Ancient Athens to Silicon Valley', 'current', 4, 250, 'Eric Weiner'),
    b('Mindset: The New Psychology of Success', 'current', 4, 250, 'Carol S. Dweck'),
    b('Leadership and Self-Deception: Getting Out of the Box', 'current', 4, 250, 'The Arbinger Institute'),
    b('The Anatomy of Peace: Resolving the Heart of Conflict', 'current', 4, 250, 'The Arbinger Institute'),
  ]),
  m(2022, 10, [
    b('The Product-Led Organization: Drive Growth By Putting Product at the Center of Your Customer Experience', 'current', 3, 250, 'Todd Olson'),
    b('The Long Game: How to Be a Long-Term Thinker in a Short-Term World', 'current', 3, 250, 'Dorie Clark'),
    b('Storyworthy: Engage, Teach, Persuade, and Change Your Life through the Power of Storytelling', ['life', 'ideas'], 5, 250, 'Matthew Dicks'),
    b('Wolf Hall (Thomas Cromwell, #1)', 'current', 4, 250, 'Hilary Mantel'),
    b('The Rosie Project (Don Tillman, #1)', 'current', 4, 250, 'Graeme Simsion'),
    b('Our Missing Hearts', 'current', 4, 250, 'Celeste Ng'),
    b('And a Bottle of Rum: A History of the New World in Ten Cocktails', 'current', 3, 250, 'Wayne Curtis'),
  ]),
  m(2022, 11, [
    b('No Rules Rules: Netflix and the Culture of Reinvention', ['ideas', 'history'], 5, 250, 'Reed Hastings'),
    b('Power And Prediction: The Disruptive Economics of Artificial Intelligence', 'ideas', 3, 250, 'Ajay Agrawal'),
    b('User Friendly: How the Hidden Rules of Design Are Changing the Way We Live, Work, and Play', ['history', 'ideas'], 5, 250, 'Cliff Kuang'),
    b('Tracers in the Dark: The Global Hunt for the Crime Lords of Cryptocurrency', ['ideas', 'escapist'], 5, 250, 'Andy Greenberg'),
    b('A Flicker in the Dark', 'escapist', 4, 250, 'Stacy Willingham'),
    b('Amp It Up: Leading for Hypergrowth by Raising Expectations, Increasing Urgency, and Elevating Intensity', 'ideas', 4, 250, 'Frank Slootman'),
    b('The Golden Enclaves (The Scholomance, #3)', 'current', 3, 250, 'Naomi Novik'),
    b('Doctors and Distillers: The Remarkable Medicinal History of Beer, Wine, Spirits, and Cocktails', 'current', 3, 250, 'Camper English'),
    b('Where\'d You Go, Bernadette', 'life', 5, 250, 'Maria Semple'),
    b('The Effortless Experience: Conquering the New Battleground for Customer Loyalty', 'current', 3, 250, 'Matthew Dixon'),
    b('My Life in Full: Work, Family, and Our Future', ['ideas', 'history'], 5, 250, 'Indra Nooyi'),
  ]),
  m(2023, 0, [
    b('Carrie Soto Is Back', 'life', 5, 250, 'Taylor Jenkins Reid'),
    b('The Vibrant Years', 'life', 4, 250, 'Sonali Dev'),
    b('One by One', 'escapist', 4, 250, 'Ruth Ware'),
    b('Arsenic and Adobo (Tita Rosie\'s Kitchen Mystery, #1)', ['life', 'escapist'], 2, 250, 'Mia P. Manansala'),
    b('Compassionate Leadership: How to Do Hard Things in a Human Way', 'ideas', 3, 250, 'Rasmus Hougaard'),
    b('The Maid (Molly the Maid, #1)', ['escapist', 'life'], 2, 250, 'Nita Prose'),
    b('The Man Who Died Twice (Thursday Murder Club, #2)', ['escapist', 'life'], 3, 250, 'Richard Osman'),
    b('Leading in Tough Times: Overcome Even the Greatest Challenges with Courage and Confidence', 'ideas', 4, 250, 'John C. Maxwell'),
    b('Killers of a Certain Age', 'escapist', 4, 250, 'Deanna Raybourn'),
    b('A Curious Beginning (Veronica Speedwell, #1)', ['escapist', 'history'], 4, 250, 'Deanna Raybourn'),
    b('A Perilous Undertaking (Veronica Speedwell, #2)', ['escapist', 'history'], 3, 250, 'Deanna Raybourn'),
    b('Tomorrow, and Tomorrow, and Tomorrow', ['history', 'life'], 5, 250, 'Gabrielle Zevin'),
    b('Remarkably Bright Creatures', ['life', 'nature'], 4, 250, 'Shelby Van Pelt'),
    b('The Inner Game of Tennis: The Classic Guide to the Mental Side of Peak Performance', ['ideas', 'life'], 3, 250, 'W. Timothy Gallwey'),
    b('Do Hard Things: Why We Get Resilience Wrong and the Surprising Science of Real Toughness', 'ideas', 4, 250, 'Steve Magness'),
    b('Empowered: Ordinary People, Extraordinary Products', 'ideas', 4, 250, 'Marty Cagan'),
    b('Smart Brevity: The Power of Saying More with Less', ['ideas', 'life'], 3, 250, 'Jim Vandehei'),
  ]),
  m(2023, 1, [
    b('Open', ['history', 'life'], 4, 250, 'Andre Agassi'),
    b('Trillion Dollar Coach: The Leadership Playbook of Silicon Valley\'s Bill Campbell', ['ideas', 'life'], 4, 250, 'Eric Schmidt'),
    b('Give and Take: A Revolutionary Approach to Success', 'ideas', 4, 250, 'Adam M. Grant'),
    b('Daughter of the Moon Goddess (The Celestial Kingdom, #1)', ['escapist', 'history'], 4, 250, 'Sue Lynn Tan'),
    b('A Court of Thorns and Roses (A Court of Thorns and Roses, #1)', ['escapist', 'life'], 3, 250, 'Sarah J. Maas'),
    b('How Far the Light Reaches: A Life in Ten Sea Creatures', ['life', 'nature', 'ideas'], 4, 250, 'Sabrina Imbler'),
    b('A Court of Mist and Fury (A Court of Thorns and Roses, #2)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('A Court of Wings and Ruin (A Court of Thorns and Roses, #3)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('Sid Meier\'s Memoir!: A Life in Computer Games', ['history', 'ideas'], 4, 250, 'Sid Meier'),
    b('A Court of Silver Flames (A Court of Thorns and Roses, #4)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('The Very Secret Society of Irregular Witches', ['escapist', 'life'], 5, 250, 'Sangu Mandanna'),
  ]),
  m(2023, 2, [
    b('State of Terror', ['history', 'escapist'], 4, 250, 'Hillary Rodham Clinton'),
    b('I\'m Glad My Mom Died', ['escapist', 'history'], 3, 250, 'Jennette McCurdy'),
    b('Heart of the Sun Warrior (The Celestial Kingdom, #2)', ['escapist', 'history'], 3, 250, 'Sue Lynn Tan'),
    b('I Hear You: The Surprisingly Simple Skill Behind Extraordinary Relationships', 'ideas', 5, 250, 'Michael S. Sorensen'),
    b('The Last Lifeboat', ['history', 'life'], 3, 250, 'Hazel Gaynor'),
    b('The Soulmate', 'escapist', 3, 250, 'Sally Hepworth'),
    b('Dear Edward', ['escapist', 'life'], 4, 250, 'Ann Napolitano'),
  ]),
  m(2023, 3, [
    b('It Ends with Us (It Ends with Us, #1)', ['escapist', 'life'], 4, 250, 'Colleen Hoover'),
    b('User Story Mapping: Discover the Whole Story, Build the Right Product', 'ideas', 4, 250, 'Jeff Patton'),
    b('Sh*t My Dad Says', ['history', 'life'], 4, 250, 'Justin Halpern'),
    b('It Starts with Us (It Ends with Us, #2)', ['escapist', 'life'], 3, 250, 'Colleen Hoover'),
    b('Impromptu: Amplifying Our Humanity Through AI', 'ideas', 3, 250, 'Reid Hoffman'),
    b('The Ministry for the Future', ['escapist', 'ideas'], 3, 250, 'Kim Stanley Robinson'),
    b('Camp Zero', ['escapist', 'ideas'], 3, 250, 'Michelle Min Sterling'),
    b('The Great Reclamation', ['history', 'life'], 5, 250, 'Rachel Heng'),
  ]),
  m(2023, 4, [
    b('Joan', ['escapist', 'history', 'life'], 5, 250, 'Katherine J. Chen'),
    b('Scaling People: Tactics for Management and Company Building', 'ideas', 4, 250, 'Claire Hughes Johnson'),
    b('The Chinese Groove', ['history', 'life'], 3, 250, 'Kathryn Ma'),
    b('Wrong Place Wrong Time', 'escapist', 4, 250, 'Gillian McAllister'),
    b('The Wager: A Tale of Shipwreck, Mutiny and Murder', ['escapist', 'history', 'nature'], 4, 250, 'David Grann'),
  ]),
  m(2023, 5, [
    b('Up Home: One Girl\'s Journey', 'history', 4, 250, 'Ruth J. Simmons'),
    b('The Spectacular', ['history', 'life'], 4, 250, 'Fiona Davis'),
    b('Yellowface', ['history', 'life', 'escapist'], 4, 250, 'R.F. Kuang'),
  ]),
  m(2023, 6, [
    b('The Art Thief: A True Story of Love, Crime, and a Dangerous Obsession', ['escapist', 'history'], 5, 250, 'Michael Finkel'),
    b('Recoding America: Why Government Is Failing in the Digital Age and How We Can Do Better', ['ideas', 'history'], 4, 250, 'Jennifer Pahlka'),
  ]),
  m(2023, 7, [
    b('Fourth Wing (The Empyrean, #1)', 'escapist', 5, 250, 'Rebecca Yarros'),
    b('The Golden Gate', 'history', 3, 250, 'Amy Chua'),
  ]),
  m(2023, 8, [
    b('Demonstrating To WIN!: The Indispensable Guide for Demonstrating Complex Products', 'ideas', 3, 250, 'Robert Riefstahl'),
  ]),
  m(2023, 9, [
    b('The Coming Wave: Technology, Power, and the Twenty-first Century\'s Greatest Dilemma', 'ideas', 3, 250, 'Mustafa Suleyman'),
    b('Elon Musk', ['ideas', 'history'], 4, 250, 'Walter Isaacson'),
  ]),
  m(2023, 10, [
    b('The Fund: Ray Dalio, Bridgewater Associates, and the Unraveling of a Wall Street Legend', ['ideas', 'history', 'escapist'], 4, 250, 'Rob Copeland'),
  ]),
  m(2024, 0, [
    b('Iron Flame (The Empyrean, #2)', 'escapist', 4, 250, 'Rebecca Yarros'),
    b('Exit Interview: The Life and Death of My Ambitious Career', ['history', 'escapist'], 5, 250, 'Kristi Coulter'),
    b('The Worlds I See: Curiosity, Exploration, and Discovery at the Dawn of AI', 'ideas', 4, 250, 'Fei-Fei Li'),
  ]),
  m(2024, 2, [
    b('Be Useful: Seven Tools for Life', ['history', 'ideas', 'life'], 3, 250, 'Arnold Schwarzenegger'),
    b('Eve: How the Female Body Drove 200 Million Years of Human Evolution', ['history', 'ideas'], 4, 250, 'Cat Bohannon'),
    b('A Wizard\'s Guide to Defensive Baking', ['escapist', 'life'], 4, 250, 'T. Kingfisher'),
  ]),
  m(2024, 3, [
    b('The Twilight Garden', ['nature', 'life'], 3, 250, 'Sara Nisha Adams'),
    b('The Secret Island (Secret Series, #1)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Five Go Adventuring Again (Famous Five, #2)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Five Run Away Together (Famous Five, #3)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Five on a Treasure Island (Famous Five, #1)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Enid Blyton: A Literary Life', ['life', 'history'], 3, 250, 'Andrew Maunder'),
    b('The Wishing Game', ['escapist', 'life'], 4, 250, 'Meg Shaffer'),
    b('The Garden of Evening Mists', ['escapist', 'history', 'life'], 5, 250, 'Tan Twan Eng'),
    b('The Edge of Anything', 'life', 3, 250, 'Nora Shalaway Carpenter'),
    b('Chemistry', ['history', 'life'], 3, 250, 'Weike Wang'),
    b('Demon Copperhead', ['escapist', 'history', 'life'], 5, 250, 'Barbara Kingsolver'),
    b('Rice, Noodle, Fish: Deep Travels Through Japan\'s Food Culture', ['history', 'life', 'nature'], 5, 250, 'Matt Goulding'),
    b('Hello Beautiful', ['history', 'life'], 5, 250, 'Ann Napolitano'),
  ]),
  m(2024, 4, [
    b('The Heaven & Earth Grocery Store', ['history', 'life'], 5, 250, 'James McBride'),
    b('The Women', ['escapist', 'history', 'life'], 5, 250, 'Kristin Hannah'),
    b('The Covenant of Water', ['history', 'life'], 5, 250, 'Abraham Verghese'),
    b('The Little Liar', ['escapist', 'history'], 3, 250, 'Mitch Albom'),
    b('The Tennis Partner', ['life', 'escapist'], 4, 250, 'Abraham Verghese'),
    b('Grape, Olive, Pig: Deep Travels Through Spain\'s Food Culture', ['history', 'life', 'nature'], 5, 250, 'Matt Goulding'),
    b('Pasta, Pane, Vino: Deep Travels Through Italy\'s Food Culture', ['history', 'life', 'nature'], 5, 250, 'Matt Goulding'),
  ]),
  m(2024, 5, [
    b('Cork Boat', ['escapist', 'life'], 4, 250, 'John Pollack'),
    b('Quit: The Power of Knowing When to Walk Away', 'ideas', 4, 250, 'Annie Duke'),
    b('The Paris Novel', ['life', 'nature'], 4, 250, 'Ruth Reichl'),
    b('Real Americans', ['history', 'life', 'ideas'], 4, 250, 'Rachel Khong'),
    b('Mother-Daughter Murder Night', ['history', 'escapist', 'life'], 5, 250, 'Nina Simon'),
    b('The Frayed Atlantic Edge: A Historian\'s Journey from Shetland to the Channel', ['escapist', 'history', 'nature'], 3, 250, 'David Gange'),
  ]),
  m(2024, 6, [
    b('Miss Morgan\'s Book Brigade', ['history', 'life'], 3, 250, 'Janet Skeslien Charles'),
    b('The Perfect Marriage (Perfect, #1)', 'escapist', 3, 250, 'Jeneva Rose'),
    b('Year of Yes', ['life', 'ideas'], 4, 250, 'Shonda Rhimes'),
    b('A Truck Full of Money', ['ideas', 'life'], 3, 250, 'Tracy Kidder'),
    b('The Sicilian Inheritance', ['history', 'escapist', 'nature'], 3, 250, 'Jo Piazza'),
    b('Jaws (Jaws, #1)', ['escapist', 'nature'], 4, 250, 'Peter Benchley'),
    b('Deep Shadow (Caribbean Dive Adventures #1)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Deep Cut (Caribbean Dive Adventures #2)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Boone: A Deep Series Prequel (The Deep Series)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Roots (Caribbean Dive Adventures #3)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Deep Devil (The Deep, #4)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Focus (Deep #5)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Hex (The Deep Series Book 6)', 'escapist', 4, 250, 'Nick Sullivan'),
  ]),
  m(2024, 7, [
    b('The House of Eve', ['history', 'escapist'], 3, 250, 'Sadeqa Johnson'),
    b('Humankind: A Hopeful History', ['history', 'life', 'ideas'], 4, 250, 'Rutger Bregman'),
  ]),
  m(2024, 8, [
    b('The Underworld: Journeys to the Depths of the Ocean', ['escapist', 'nature', 'ideas'], 5, 250, 'Susan Casey'),
    b('Pattern Breakers: Why Some Start-Ups Change the Future', 'ideas', 4, 250, 'Mike Maples Jr.'),
    b('The River', ['escapist', 'nature'], 4, 250, 'Peter Heller'),
    b('The President\'s Daughter', ['history', 'escapist'], 3, 250, 'Bill Clinton'),
  ]),
  m(2024, 9, [
    b('Legends & Lattes (Legends & Lattes, #1)', ['escapist', 'life'], 5, 250, 'Travis Baldree'),
    b('Selling Sexy: Victoria\'s Secret and the Unraveling of an American Icon', ['ideas', 'history', 'escapist'], 4, 250, 'Lauren Sherman'),
  ]),
  m(2024, 10, [
    b('What You Are Looking for Is in the Library', 'life', 5, 250, 'Michiko Aoyama'),
    b('Playground', ['life', 'nature', 'ideas'], 3, 250, 'Richard Powers'),
    b('The Girl Beneath the Sea (Underwater Investigation Unit, #1)', 'escapist', 3, 250, 'Andrew Mayne'),
    b('Beached (A Mer Cavallo Mystery #2)', 'escapist', 3, 250, 'Micki Browning'),
    b('Adrift', 'escapist', 3, 250, 'Micki Browning'),
    b('Twelve Mile Bank (A.J. Bailey Adventure #1)', 'escapist', 3, 250, 'Nicholas Harvey'),
  ]),
  m(2024, 11, [
    b('Be Ready When the Luck Happens', 'life', 4, 250, 'Ina Garten'),
    b('Adrift: The Truth Won\'t Always Set You Free', 'escapist', 4, 250, 'Lisa Brideau'),
    b('After I Do', 'life', 4, 250, 'Taylor Jenkins Reid'),
    b('The God of the Woods', 'escapist', 5, 250, 'Liz Moore'),
    b('A Walk in the Park: The True Story of a Spectacular Misadventure in the Grand Canyon', ['escapist', 'nature'], 4, 250, 'Kevin Fedarko'),
    b('Wellness', ['history', 'life'], 4, 250, 'Nathan Hill'),
    b('Somewhere Beyond the Sea (Cerulean Chronicles, #2)', ['escapist', 'life'], 4, 250, 'T.J. Klune'),
    b('Things You Save in a Fire', 'life', 4, 250, 'Katherine Center'),
  ]),
  m(2025, 0, [
    b('The Charm School', ['history', 'escapist'], 4, 250, 'Nelson DeMille'),
    b('The Spy and the Traitor: The Greatest Espionage Story of the Cold War', ['escapist', 'history', 'ideas'], 5, 250, 'Ben Macintyre'),
    b('The Nvidia Way: Jensen Huang and the Making of a Tech Giant', 'ideas', 4, 250, 'Tae Kim'),
    b('A River Enchanted (Elements of Cadence, #1)', ['escapist', 'life'], 5, 250, 'Rebecca Ross'),
    b('A Fire Endless (Elements of Cadence, #2)', ['escapist', 'life'], 4, 250, 'Rebecca Ross'),
    b('Take the Lead: Hanging On, Letting Go, and Conquering Life\'s Hardest Climbs', ['escapist', 'life'], 3, 250, 'Sasha DiGiulian'),
    b('Onyx Storm (The Empyrean, #3)', 'escapist', 4, 250, 'Rebecca Yarros'),
  ]),
  m(2025, 1, [
    b('The Will of the Many (Hierarchy, #1)', ['escapist', 'ideas'], 5, 250, 'James Islington'),
    b('Society of Lies', 'escapist', 3, 250, 'Lauren Ling Brown'),
  ]),
  m(2025, 2, [
    b('Cabin: Off the Grid Adventures with a Clueless Craftsman', ['escapist', 'nature', 'life'], 4, 250, 'Patrick Hutchison'),
    b('Co-Intelligence: Living and Working with AI', 'ideas', 5, 250, 'Ethan Mollick'),
    b('The Winemaker\'s Wife', ['escapist', 'history'], 4, 250, 'Kristin Harmel'),
    b('Source Code: My Beginnings', 'ideas', 4, 250, 'Bill Gates'),
    b('Wool (Wool, #1)', ['escapist', 'life'], 4, 250, 'Hugh Howey'),
    b('AI Superpowers: China, Silicon Valley, and the New World Order', ['ideas', 'history'], 3, 250, 'Kai-Fu Lee'),
    b('AI 2041: Ten Visions for Our Future', 'ideas', 3, 250, 'Kai-Fu Lee'),
    b('Unmasking AI: My Mission to Protect What Is Human in a World of Machines', ['ideas', 'escapist'], 5, 250, 'Joy Buolamwini'),
  ]),
  m(2025, 3, [
    b('How to End a Love Story', ['escapist', 'life'], 3, 250, 'Yulin Kuang'),
    b('Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy', ['ideas', 'history', 'life'], 3, 250, 'Cathy O\'Neil'),
    b('Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy', ['ideas', 'escapist'], 4, 250, 'Cathy O\'Neil'),
    b('2034: A Novel of the Next World War', ['history', 'life', 'escapist'], 5, 250, 'Elliot Ackerman'),
    b('Graceless', 'life', 3, 250, 'Wayne Stinnett'),
    b('Eruption', ['ideas', 'escapist'], 2, 250, 'Michael Crichton'),
    b('Women & Power: A Manifesto', ['history', 'ideas'], 4, 250, 'Mary Beard'),
    b('A Well-Trained Wife: My Escape from Christian Patriarchy', ['life', 'escapist'], 5, 250, 'Tia Levings'),
    b('The Advocate\'s Devil (The Advocate\'s Devil, #1)', ['history', 'life'], 3, 250, 'Walter Woon'),
    b('The Quiet Librarian', 'escapist', 4, 250, 'Allen Eskens'),
    b('Summer Island', 'life', 3, 250, 'Kristin Hannah'),
    b('Timeless (Tropical Adventure #2)', ['escapist', 'history'], 3, 250, 'Wayne Stinnett'),
    b('Sea Power: The History and Geopolitics of the World\'s Oceans', ['history', 'nature'], 4, 250, 'James G. Stavridis'),
    b('The Wedding People', 'life', 5, 250, 'Alison Espach'),
    b('We Solve Murders (We Solve Murders, #1)', ['escapist', 'life'], 4, 250, 'Richard Osman'),
  ]),
  m(2025, 4, [
    b('The Cartographers', ['history', 'escapist', 'life'], 4, 250, 'Peng Shepherd'),
    b('Saving Five: A Memoir of Hope', 'life', 4, 250, 'Amanda Nguyen'),
    b('The House of My Mother: A Daughter\'s Quest for Freedom', ['history', 'life'], 3, 250, 'Shari Franke'),
    b('The Hunger Games (The Hunger Games, #1)', 'escapist', 5, 250, 'Suzanne Collins'),
    b('Catching Fire (The Hunger Games, #2)', 'escapist', 5, 250, 'Suzanne Collins'),
    b('Mockingjay (The Hunger Games, #3)', 'escapist', 3, 250, 'Suzanne Collins'),
  ]),
  m(2025, 5, [
    b('Wordslut: A Feminist Guide to Taking Back the English Language', ['history', 'life'], 3, 250, 'Amanda Montell'),
    b('All My Colors', ['history', 'life'], 2, 250, 'David Quantick'),
    b('2054', ['history', 'life'], 3, 250, 'Elliot Ackerman'),
    b('Ghost Fleet: A Novel of the Next World War', ['ideas', 'history', 'escapist'], 3, 250, 'P.W. Singer'),
    b('Sunrise on the Reaping (The Hunger Games, #0.5)', 'escapist', 4, 250, 'Suzanne Collins'),
    b('Throne of Glass', ['life', 'escapist'], 4, 250, 'Sarah J. Maas'),
    b('Throne of Glass (Throne of Glass, #1)', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Crown of Midnight (Throne of Glass, #2)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('Heir of Fire (Throne of Glass, #3)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('Queen of Shadows (Throne of Glass, #4)', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Empire of Storms (Throne of Glass, #5)', 'escapist', 5, 250, 'Sarah J. Maas'),
  ]),
  m(2025, 6, [
    b('Tower of Dawn (Throne of Glass, #6)', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Kingdom of Ash (Throne of Glass, #7)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('The Kamogawa Food Detectives (Kamogawa Food Detectives, #1)', 'life', 4, 250, 'Hisashi Kashiwai'),
    b('Atmosphere', 'life', 5, 250, 'Taylor Jenkins Reid'),
    b('Careless People: A Cautionary Tale of Power, Greed, and Lost Idealism', ['ideas', 'escapist'], 5, 250, 'Sarah Wynn-Williams'),
    b('The Director', ['history', 'life', 'escapist'], 2, 250, 'David Ignatius'),
    b('Carrie Soto Is Back', 'life', 5, 250, 'Taylor Jenkins Reid'),
  ]),
  m(2025, 7, [
    b('The Singles Game', ['history', 'ideas'], 3, 250, 'Lauren Weisberger'),
    b('Sea Kayaker\'s Deep Trouble: True Stories and Their Lessons from Sea Kayaker Magazine', ['escapist', 'nature', 'ideas'], 3, 250, 'Matt Broze'),
    b('The Third Target (J. B. Collins #1)', ['history', 'escapist'], 4, 250, 'Joel C. Rosenberg'),
    b('The First Hostage (J. B. Collins, #2)', 'escapist', 4, 250, 'Joel C. Rosenberg'),
    b('Without Warning (J. B. Collins, #3)', 'escapist', 4, 250, 'Joel C. Rosenberg'),
    b('My Friends', 'life', 5, 250, 'Fredrik Backman'),
    b('Hunger Like a Thirst: From Food Stamps to Fine Dining, a Restaurant Critic Finds Her Place at the Table', ['history', 'life'], 3, 250, 'Besha Rodell'),
    b('The Other Side of Now', 'life', 3, 250, 'Paige Harbison'),
    b('The Dead Husband Cookbook', 'escapist', 4, 250, 'Danielle Valentine'),
  ]),
  m(2025, 8, [
    b('The First Gentleman', ['history', 'life'], 3, 250, 'Bill Clinton'),
    b('Squid Empire: The Rise and Fall of the Cephalopods', ['history', 'ideas'], 4, 250, 'Danna Staaf'),
    b('She Didn\'t See It Coming', ['ideas', 'escapist'], 3, 250, 'Shari Lapena'),
    b('Homewaters: A Human and Natural History of Puget Sound', ['history', 'nature', 'life'], 4, 250, 'David B. Williams'),
    b('It\'s Only Drowning: A True Story of Learning to Surf and the Search for Common Ground', ['escapist', 'life'], 3, 250, 'David Litt'),
    b('The Seaweed Revolution: How Seaweed Has Shaped Our Past and Can Save Our Future', ['life', 'nature', 'ideas'], 3, 250, 'Vincent Doumeizel'),
    b('The Favorites', 'life', 4, 250, 'Layne Fargo'),
    b('The Grand Paloma Resort', ['history', 'escapist'], 3, 250, 'Cleyvis Natera'),
    b('The Authenticity Project', 'life', 5, 250, 'Clare Pooley'),
  ]),
  m(2025, 9, [
    b('A Different Kind of Power', ['history', 'ideas', 'life'], 4, 250, 'Jacinda Ardern'),
    b('Brave New World and Brave New World Revisited', ['history', 'ideas', 'life'], 5, 250, 'Aldous Huxley'),
    b('17A Keong Saik Road', ['history', 'life'], 2, 250, 'Charmaine Leung'),
    b('Invitation to a Banquet: The Story of Chinese Food', ['history', 'life'], 5, 250, 'Fuchsia Dunlop'),
    b('Murder Two Doors Down', 'escapist', 3, 250, 'Chuck Storla'),
    b('The Boys\' Club', ['history', 'life'], 4, 250, 'Erica Katz'),
  ]),
  m(2025, 10, [
    b('HBR Guide to Generative AI for Managers', 'ideas', 3, 250, 'Elisa Farri'),
    b('The Guide', ['escapist', 'life'], 4, 250, 'Peter Heller'),
    b('The Correspondent', 'life', 5, 250, 'Virginia Evans'),
    b('A Witch\'s Guide to Magical Innkeeping', ['escapist', 'life'], 5, 250, 'Sangu Mandanna'),
    b('The Academy', 'life', 3, 250, 'Elin Hilderbrand'),
    b('Culpability', ['ideas', 'life'], 5, 250, 'Bruce Holsinger'),
    b('Shark\'s Fin and Sichuan Pepper: A Sweet-Sour Memoir of Eating in China', ['history', 'life', 'nature'], 4, 250, 'Fuchsia Dunlop'),
    b('This American Woman: A One-in-a-Billion Memoir', ['history', 'life'], 5, 250, 'Zarna Garg'),
    b('Gone Before Goodbye', 'life', 1, 250, 'Reese Witherspoon'),
  ]),
  m(2025, 11, [
    b('Make it a Double: From Wretched to Wondrous: Tales of One Woman\'s Lifelong Discovery of Whisky', 'life', 2, 250, 'Shelley Sackier'),
    b('Beautyland', 'life', 4, 250, 'Marie-Helene Bertino'),
    b('The Ocean\'s Menagerie: How Earth\'s Strangest Creatures Reshape the Rules of Life', ['ideas', 'nature'], 4, 250, 'Drew Harvell'),
    b('Flesh', ['escapist', 'life'], 2, 250, 'David Szalay'),
    b('The Stationery Shop', ['history', 'life'], 4, 250, 'Marjan Kamali'),
    b('The Strength of the Few (Hierarchy, #2)', 'escapist', 4, 250, 'James Islington'),
    b('The Magician\'s Assistant', 'life', 3, 250, 'Ann Patchett'),
    b('The Compound', 'life', 3, 250, 'Aisling Rawle'),
    b('Beating the Algorithm: Overriding the Script of Life', ['ideas', 'life'], 4, 250, 'Cheo Ming Shen'),
    b('A Marriage at Sea: A True Story of Love, Obsession, and Shipwreck', ['escapist', 'life', 'nature'], 4, 250, 'Sophie Elmhirst'),
    b('Ocean: Earth’s Last Wilderness', ['history', 'nature', 'life'], 4, 250, 'David Attenborough'),
    b('Ocean: Earth\'s Last Wilderness', ['nature', 'life', 'ideas'], 4, 250, 'David Attenborough'),
    b('Kitchen Confidential: Adventures in the Culinary Underbelly', ['history', 'life', 'escapist'], 4, 250, 'Anthony Bourdain'),
    b('The Amazing Adventures of Kavalier & Clay', ['escapist', 'history', 'life'], 5, 250, 'Michael Chabon'),
  ]),
  m(2026, 0, [
    b('The Troublemaker: How Jimmy Lai Became a Billionaire, Hong Kong\'s Greatest Dissident, and China\'s Most Feared Critic', 'history', 3, 250, 'Mark L. Clifford'),
    b('House of Huawei: The Secret History of China\'s Most Powerful Company', ['ideas', 'history'], 5, 250, 'Eva Dou'),
    b('Mother Mary Comes to Me', ['life', 'history'], 3, 250, 'Arundhati Roy'),
    b('The Road to Tender Hearts', 'life', 3, 250, 'Annie Hartnett'),
    b('King of Kings: The Iranian Revolution—A Story of Hubris, Delusion and Catastrophic Miscalculation', ['history', 'ideas'], 5, 250, 'Scott Anderson'),
    b('Is a River Alive?', ['ideas', 'nature', 'life'], 5, 250, 'Robert Macfarlane'),
    b('Empire of AI: Dreams and Nightmares in Sam Altman\'s OpenAI', ['ideas', 'escapist'], 5, 250, 'Karen Hao'),
    b('Beasts of a Little Land', ['history', 'life'], 3, 250, 'Juhea Kim'),
    b('Bird by Bird', 'life', 3, 250, 'Anne Lamott'),
    b('Like Water for Chocolate', ['history', 'life'], 5, 250, 'Laura Esquivel; Carol and Tom Christensen [trans]'),
    b('My Mexico City Kitchen: Recipes and Convictions', ['history', 'life'], 5, 250, 'Gabriela Camara'),
    b('The Loneliness of Sonia and Sunny', 'life', 3, 250, 'Kiran Desai'),
    b('Moderation', ['history', 'life'], 3, 250, 'Elaine Castillo'),
  ]),
  m(2026, 1, [
    b('Airplane Mode: An Irreverent History of Travel', ['history', 'life', 'nature'], 3, 250, 'Shahnaz Habib'),
    b('Unreasonable Hospitality: The Remarkable Power of Giving People More Than They Expect', ['ideas', 'life'], 5, 250, 'Will Guidara'),
    b('Buttermilk Graffiti: A Chef’s Journey to Discover America’s New Melting-Pot Cuisine', ['history', 'life', 'nature'], 4, 250, 'Edward Lee'),
    b('Smoke and Pickles: Recipes and Stories from a New Southern Kitchen', ['history', 'life'], 3, 250, 'Edward Lee'),
  ]),
  m(2026, 2, [
    b('Genius Makers: The Mavericks Who Brought AI to Google, Facebook, and the World', ['ideas', 'history'], 5, 250, 'Cade Metz'),
    b('So Old, So Young', 'life', 3, 250, 'Grant Ginder'),
    b('Kook: What Surfing Taught Me About Love, Life, and Catching the Perfect Wave', ['life', 'nature'], 3, 250, 'Peter Heller'),
    b('The Spies of Shilling Lane', ['history', 'life'], 2, 250, 'Jennifer Ryan'),
    b('Breakneck: China\'s Quest to Engineer the Future', ['ideas', 'history'], 5, 250, 'Dan Wang'),
  ]),
];
