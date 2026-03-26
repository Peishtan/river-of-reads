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

// Real reading data — tagged books from 2021 onwards
export const readingData: MonthData[] = [
  m(2021, 0, [
    b('The Poisonwood Bible', ['history', 'life'], 4, 250, 'Barbara Kingsolver'),
    b('Ready Player Two (Ready Player One, #2)', ['escapist', 'ideas'], 2, 250, 'Ernest Cline'),
    b('Beach Read', ['escapist', 'life'], 3, 250, 'Emily Henry'),
    b('The Paper Daughters of Chinatown', ['history', 'life'], 3, 250, 'Heather B. Moore'),
    b('Caste: The Origins of Our Discontents', ['history', 'ideas', 'life'], 4, 250, 'Isabel Wilkerson'),
  ]),
  m(2021, 1, [
    b('The Three-Body Problem (Remembrance of Earth\'s Past, #1)', 'ideas', 3, 250, 'Liu Cixin'),
    b('The House of the Spirits', ['history', 'life'], 4, 250, 'Isabel Allende'),
    b('The Invisible Life of Addie LaRue', 'life', 5, 250, 'V.E. Schwab'),
    b('Black Buck', ['history', 'life'], 3, 250, 'Mateo Askaripour'),
    b('The Riot Act', 'history', 3, 250, 'Sebastian Sim'),
    b('The House in the Cerulean Sea (Cerulean Chronicles, #1)', ['escapist', 'life'], 5, 250, 'T.J. Klune'),
    b('Rhythm of War (The Stormlight Archive, #4)', ['escapist', 'ideas'], 4, 250, 'Brandon Sanderson'),
  ]),
  m(2021, 2, [
    b('Radical Candor: Be a Kickass Boss Without Losing Your Humanity', 'ideas', 5, 250, 'Kim Malone Scott'),
    b('The Code Breaker: Jennifer Doudna, Gene Editing, and the Future of the Human Race', ['history', 'ideas'], 3, 250, 'Walter Isaacson'),
    b('The Thursday Murder Club (Thursday Murder Club, #1)', ['escapist', 'life'], 4, 250, 'Richard Osman'),
    b('Piranesi', ['escapist', 'life'], 3, 250, 'Susanna Clarke'),
    b('Then We Came to the End', ['history', 'life'], 3, 250, 'Joshua Ferris'),
    b('Range: Why Generalists Triumph in a Specialized World', 'ideas', 5, 250, 'David Epstein'),
    b('Drive: The Surprising Truth About What Motivates Us', 'ideas', 4, 250, 'Daniel H. Pink'),
    b('The Good Life: Up the Yukon Without a Paddle', ['escapist', 'life', 'nature'], 4, 250, 'Dorian Amos'),
    b('High Output Management', 'ideas', 4, 250, 'Andrew S. Grove'),
  ]),
  m(2021, 3, [
    b('Station Eleven', ['escapist', 'life'], 4, 250, 'Emily St. John Mandel'),
    b('So You Want to Talk About Race', ['history', 'ideas'], 4, 250, 'Ijeoma Oluo'),
    b('Think Again: The Power of Knowing What You Don\'t Know', 'ideas', 3, 250, 'Adam M. Grant'),
    b('The Dictionary of Lost Words', ['history', 'life'], 5, 250, 'Pip Williams'),
    b('Free Food for Millionaires', ['history', 'life'], 3, 250, 'Min Jin Lee'),
    b('The Lost Apothecary', ['escapist', 'history'], 4, 250, 'Sarah Penner'),
    b('Working Backwards: Insights, Stories, and Secrets from Inside Amazon', 'ideas', 4, 250, 'Colin Bryar'),
  ]),
  m(2021, 4, [
    b('Minor Feelings: An Asian American Reckoning', ['history', 'life'], 4, 250, 'Cathy Park Hong'),
    b('The Dawn Patrol (Boone Daniels #1)', 'escapist', 3, 250, 'Don Winslow'),
    b('The Wave: In Pursuit of the Rogues, Freaks, and Giants of the Ocean', ['escapist', 'ideas', 'nature'], 4, 250, 'Susan Casey'),
    b('Murder on the Orient Express (Hercule Poirot, #10)', 'escapist', 4, 250, 'Agatha Christie'),
    b('Swell: A Sailing Surfer\'s Voyage of Awakening', ['escapist', 'life', 'nature'], 4, 250, 'Liz Clark'),
    b('The Four Winds', ['history', 'life'], 5, 250, 'Kristin Hannah'),
    b('The Glass Hotel', 'life', 3, 250, 'Emily St. John Mandel'),
    b('The Splendid and the Vile: A Saga of Churchill, Family, and Defiance During the Blitz', ['escapist', 'history', 'life'], 5, 250, 'Erik Larson'),
    b('The Last Bookshop in London', ['history', 'life'], 5, 250, 'Madeline Martin'),
    b('The Women of Chateau Lafayette', 'history', 4, 250, 'Stephanie Dray'),
    b('The Kitchen Front', ['history', 'life', 'nature'], 4, 250, 'Jennifer Ryan'),
  ]),
  m(2021, 5, [
    b('Lights Out: Pride, Delusion, and the Fall of General Electric', ['history', 'ideas', 'life'], 3, 250, 'Thomas Gryta'),
    b('The Sound of Gravel', 'life', 3, 250, 'Ruth Wariner'),
    b('Troubled Blood (Cormoran Strike, #5)', 'escapist', 5, 250, 'Robert Galbraith'),
    b('The Seven Husbands of Evelyn Hugo', ['history', 'life'], 5, 250, 'Taylor Jenkins Reid'),
    b('The Girl Who Drew Butterflies: How Maria Merian\'s Art Changed Science', ['history', 'ideas', 'nature'], 4, 250, 'Joyce Sidman'),
    b('The Rose Code', ['escapist', 'history', 'life'], 5, 250, 'Kate Quinn'),
    b('One Breath: Freediving, Death, and the Quest to Shatter Human Limits', ['escapist', 'life', 'nature'], 5, 250, 'Adam Skolnick'),
  ]),
  m(2021, 6, [
    b('Klara and the Sun', ['ideas', 'life'], 4, 250, 'Kazuo Ishiguro'),
    b('Deep: Freediving, Renegade Science, and What the Ocean Tells Us About Ourselves', ['escapist', 'ideas', 'nature'], 5, 250, 'James Nestor'),
    b('Brotopia: Breaking Up the Boys\' Club of Silicon Valley', ['history', 'ideas', 'life'], 4, 250, 'Emily Chang'),
    b('Project Hail Mary', ['escapist', 'ideas'], 5, 250, 'Andy Weir'),
    b('Uncanny Valley', ['history', 'ideas', 'life'], 4, 250, 'Anna Wiener'),
    b('The Last Thing He Told Me (Hannah Hall, #1)', 'escapist', 5, 250, 'Laura Dave'),
    b('Her Last Flight', ['escapist', 'history'], 3, 250, 'Beatriz Williams'),
    b('The Other Black Girl', ['escapist', 'history', 'life'], 4, 250, 'Zakiya Dalila Harris'),
    b('Gold Diggers', ['history', 'life'], 3, 250, 'Sanjena Sathian'),
    b('If the Oceans Were Ink: An Unlikely Friendship and a Journey to the Heart of the Quran', ['history', 'life'], 3, 250, 'Carla Power'),
    b('Every Last Fear', 'escapist', 4, 250, 'Alex Finlay'),
  ]),
  m(2021, 7, [
    b('A Thousand Ships', ['history', 'life'], 3, 250, 'Natalie Haynes'),
    b('Crying in H Mart', ['history', 'life', 'nature'], 5, 250, 'Michelle Zauner'),
    b('Home Fire', ['history', 'life'], 3, 250, 'Kamila Shamsie'),
    b('People We Meet on Vacation', ['escapist', 'life'], 5, 250, 'Emily Henry'),
    b('Such a Fun Age', ['history', 'life'], 4, 250, 'Kiley Reid'),
    b('The One Hundred Years of Lenni and Margot', 'life', 4, 250, 'Marianne Cronin'),
  ]),
  m(2021, 8, [b('Malibu Rising', ['history', 'life'], 5, 250, 'Taylor Jenkins Reid')]),
  m(2023, 0, [
    b('Smart Brevity: The Power of Saying More with Less', 'ideas', 3, 250, 'Jim Vandehei'),
    b('Empowered: Ordinary People, Extraordinary Products', 'ideas', 4, 250, 'Marty Cagan'),
    b('Do Hard Things: Why We Get Resilience Wrong and the Surprising Science of Real Toughness', 'ideas', 4, 250, 'Steve Magness'),
    b('The Inner Game of Tennis: The Classic Guide to the Mental Side of Peak Performance', 'ideas', 3, 250, 'W. Timothy Gallwey'),
    b('Remarkably Bright Creatures', 'life', 4, 250, 'Shelby Van Pelt'),
    b('Tomorrow, and Tomorrow, and Tomorrow', ['history', 'life'], 5, 250, 'Gabrielle Zevin'),
    b('A Perilous Undertaking (Veronica Speedwell, #2)', 'escapist', 3, 250, 'Deanna Raybourn'),
    b('A Curious Beginning (Veronica Speedwell, #1)', 'escapist', 4, 250, 'Deanna Raybourn'),
    b('Killers of a Certain Age', 'escapist', 4, 250, 'Deanna Raybourn'),
    b('The Man Who Died Twice (Thursday Murder Club, #2)', ['escapist', 'life'], 3, 250, 'Richard Osman'),
    b('Leading in Tough Times: Overcome Even the Greatest Challenges with Courage and Confidence', 'ideas', 4, 250, 'John C. Maxwell'),
    b('The Maid (Molly the Maid, #1)', ['escapist', 'life'], 2, 250, 'Nita Prose'),
    b('Compassionate Leadership: How to Do Hard Things in a Human Way', 'ideas', 3, 250, 'Rasmus Hougaard'),
    b('One by One', ['escapist', 'life'], 4, 250, 'Ruth Ware'),
    b('Arsenic and Adobo (Tita Rosie\'s Kitchen Mystery, #1)', ['escapist', 'life', 'nature'], 2, 250, 'Mia P. Manansala'),
    b('The Vibrant Years', 'life', 4, 250, 'Sonali Dev'),
    b('Carrie Soto Is Back', 'life', 5, 250, 'Taylor Jenkins Reid'),
  ]),
  m(2023, 1, [
    b('The Very Secret Society of Irregular Witches', ['escapist', 'life'], 5, 250, 'Sangu Mandanna'),
    b('A Court of Silver Flames (A Court of Thorns and Roses, #4)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('Sid Meier\'s Memoir!: A Life in Computer Games', ['ideas', 'life'], 4, 250, 'Sid Meier'),
    b('A Court of Wings and Ruin (A Court of Thorns and Roses, #3)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('A Court of Mist and Fury (A Court of Thorns and Roses, #2)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('How Far the Light Reaches: A Life in Ten Sea Creatures', ['life', 'nature'], 4, 250, 'Sabrina Imbler'),
    b('A Court of Thorns and Roses (A Court of Thorns and Roses, #1)', 'escapist', 3, 250, 'Sarah J. Maas'),
    b('Daughter of the Moon Goddess (The Celestial Kingdom, #1)', ['escapist', 'history'], 4, 250, 'Sue Lynn Tan'),
    b('Give and Take: A Revolutionary Approach to Success', 'ideas', 4, 250, 'Adam M. Grant'),
    b('Trillion Dollar Coach: The Leadership Playbook of Silicon Valley\'s Bill Campbell', 'ideas', 4, 250, 'Eric Schmidt'),
    b('Open', 'life', 4, 250, 'Andre Agassi'),
  ]),
  m(2023, 2, [
    b('Dear Edward', 'life', 4, 250, 'Ann Napolitano'),
    b('The Soulmate', ['escapist', 'life'], 3, 250, 'Sally Hepworth'),
    b('The Last Lifeboat', ['escapist', 'history', 'life'], 3, 250, 'Hazel Gaynor'),
    b('I Hear You: The Surprisingly Simple Skill Behind Extraordinary Relationships', 'ideas', 5, 250, 'Michael S. Sorensen'),
    b('Heart of the Sun Warrior (The Celestial Kingdom, #2)', ['escapist', 'history'], 3, 250, 'Sue Lynn Tan'),
    b('I\'m Glad My Mom Died', 'life', 3, 250, 'Jennette McCurdy'),
    b('State of Terror', ['escapist', 'history'], 4, 250, 'Hillary Rodham Clinton'),
  ]),
  m(2023, 3, [
    b('The Great Reclamation', ['history', 'life'], 5, 250, 'Rachel Heng'),
    b('Camp Zero', ['escapist', 'ideas', 'life'], 3, 250, 'Michelle Min Sterling'),
    b('The Ministry for the Future', ['escapist', 'ideas'], 3, 250, 'Kim Stanley Robinson'),
    b('Impromptu: Amplifying Our Humanity Through AI', 'ideas', 3, 250, 'Reid Hoffman'),
    b('It Starts with Us (It Ends with Us, #2)', 'life', 3, 250, 'Colleen Hoover'),
    b('Sh*t My Dad Says', 'life', 4, 250, 'Justin Halpern'),
    b('User Story Mapping: Discover the Whole Story, Build the Right Product', 'ideas', 4, 250, 'Jeff Patton'),
    b('It Ends with Us (It Ends with Us, #1)', 'life', 4, 250, 'Colleen Hoover'),
  ]),
  m(2023, 4, [
    b('The Wager: A Tale of Shipwreck, Mutiny and Murder', ['escapist', 'history', 'life'], 4, 250, 'David Grann'),
    b('Wrong Place Wrong Time', ['escapist', 'life'], 4, 250, 'Gillian McAllister'),
    b('The Chinese Groove', ['history', 'life'], 3, 250, 'Kathryn Ma'),
    b('Scaling People: Tactics for Management and Company Building', 'ideas', 4, 250, 'Claire Hughes Johnson'),
    b('Joan', ['history', 'life'], 5, 250, 'Katherine J. Chen'),
  ]),
  m(2023, 5, [
    b('Yellowface', ['history', 'life'], 4, 250, 'R.F. Kuang'),
    b('The Spectacular', ['history', 'life'], 4, 250, 'Fiona Davis'),
    b('Up Home: One Girl\'s Journey', ['history', 'life'], 4, 250, 'Ruth J. Simmons'),
  ]),
  m(2023, 6, [b('Recoding America: Why Government Is Failing in the Digital Age and How We Can Do Better', ['history', 'ideas'], 4, 250, 'Jennifer Pahlka'), b('The Art Thief: A True Story of Love, Crime, and a Dangerous Obsession', ['escapist', 'history', 'life'], 5, 250, 'Michael Finkel')]),
  m(2023, 7, [b('The Golden Gate', ['history', 'life'], 3, 250, 'Amy Chua'), b('Fourth Wing (The Empyrean, #1)', ['escapist', 'life'], 5, 250, 'Rebecca Yarros')]),
  m(2023, 8, [b('Demonstrating To WIN!: The Indispensable Guide for Demonstrating Complex Products', 'ideas', 3, 250, 'Robert Riefstahl')]),
  m(2023, 9, [b('The Coming Wave: Technology, Power, and the Twenty-first Century\'s Greatest Dilemma', 'ideas', 3, 250, 'Mustafa Suleyman')]),
  m(2023, 10, [b('The Fund: Ray Dalio, Bridgewater Associates, and the Unraveling of a Wall Street Legend', ['ideas', 'life'], 4, 250, 'Rob Copeland')]),
  m(2024, 2, [b('A Wizard\'s Guide to Defensive Baking', ['escapist', 'life', 'nature'], 4, 250, 'T. Kingfisher'), b('Eve: How the Female Body Drove 200 Million Years of Human Evolution', ['history', 'ideas'], 4, 250, 'Cat Bohannon')]),
  m(2024, 3, [
    b('Hello Beautiful', ['history', 'life'], 5, 250, 'Ann Napolitano'),
    b('Rice, Noodle, Fish: Deep Travels Through Japan\'s Food Culture', ['history', 'nature'], 5, 250, 'Matt Goulding'),
    b('Demon Copperhead', ['history', 'life'], 5, 250, 'Barbara Kingsolver'),
    b('The Edge of Anything', 'life', 3, 250, 'Nora Shalaway Carpenter'),
    b('Chemistry', ['history', 'life'], 3, 250, 'Weike Wang'),
    b('The Garden of Evening Mists', ['history', 'life'], 5, 250, 'Tan Twan Eng'),
    b('The Wishing Game', ['escapist', 'life'], 4, 250, 'Meg Shaffer'),
    b('Enid Blyton: A Literary Life', 'history', 3, 250, 'Andrew Maunder'),
    b('Five Go Adventuring Again (Famous Five, #2)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Five Run Away Together (Famous Five, #3)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('Five on a Treasure Island (Famous Five, #1)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('The Secret Island (Secret Series, #1)', ['escapist', 'life'], 4, 250, 'Enid Blyton'),
    b('The Twilight Garden', ['life', 'nature'], 3, 250, 'Sara Nisha Adams'),
  ]),
  m(2024, 4, [
    b('Pasta, Pane, Vino: Deep Travels Through Italy\'s Food Culture', ['history', 'nature'], 5, 250, 'Matt Goulding'),
    b('Grape, Olive, Pig: Deep Travels Through Spain\'s Food Culture', ['history', 'nature'], 5, 250, 'Matt Goulding'),
    b('The Tennis Partner', 'life', 4, 250, 'Abraham Verghese'),
    b('The Little Liar', ['history', 'life'], 3, 250, 'Mitch Albom'),
    b('The Covenant of Water', ['history', 'life'], 5, 250, 'Abraham Verghese'),
    b('The Women', ['history', 'life'], 5, 250, 'Kristin Hannah'),
    b('The Heaven & Earth Grocery Store', ['history', 'life'], 5, 250, 'James McBride'),
  ]),
  m(2024, 5, [
    b('The Frayed Atlantic Edge: A Historian\'s Journey from Shetland to the Channel', ['escapist', 'history', 'nature'], 3, 250, 'David Gange'),
    b('Mother-Daughter Murder Night', ['escapist', 'history', 'life'], 5, 250, 'Nina Simon'),
    b('Real Americans', ['history', 'ideas', 'life'], 4, 250, 'Rachel Khong'),
    b('The Paris Novel', ['life', 'nature'], 4, 250, 'Ruth Reichl'),
    b('Quit: The Power of Knowing When to Walk Away', 'ideas', 4, 250, 'Annie Duke'),
    b('Cork Boat', ['escapist', 'life'], 4, 250, 'John Pollack'),
  ]),
  m(2024, 6, [
    b('Deep Hex (The Deep Series Book 6)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Deep Focus (Deep #5)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Devil (The Deep, #4)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Roots (Caribbean Dive Adventures #3)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Boone: A Deep Series Prequel (The Deep Series)', 'escapist', 3, 250, 'Nick Sullivan'),
    b('Deep Cut (Caribbean Dive Adventures #2)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Deep Shadow (Caribbean Dive Adventures #1)', 'escapist', 4, 250, 'Nick Sullivan'),
    b('Jaws (Jaws, #1)', ['escapist', 'nature'], 4, 250, 'Peter Benchley'),
    b('The Sicilian Inheritance', ['escapist', 'history', 'nature'], 3, 250, 'Jo Piazza'),
    b('A Truck Full of Money', ['ideas', 'life'], 3, 250, 'Tracy Kidder'),
    b('Year of Yes', ['ideas', 'life'], 4, 250, 'Shonda Rhimes'),
    b('The Perfect Marriage (Perfect, #1)', 'escapist', 3, 250, 'Jeneva Rose'),
    b('Miss Morgan\'s Book Brigade', ['history', 'life'], 3, 250, 'Janet Skeslien Charles'),
  ]),
  m(2024, 7, [b('Humankind: A Hopeful History', ['history', 'ideas', 'life'], 4, 250, 'Rutger Bregman'), b('The House of Eve', ['history', 'life'], 3, 250, 'Sadeqa Johnson')]),
  m(2024, 8, [
    b('The President\'s Daughter', ['escapist', 'history'], 3, 250, 'Bill Clinton'),
    b('The River', ['escapist', 'nature'], 4, 250, 'Peter Heller'),
    b('Pattern Breakers: Why Some Start-Ups Change the Future', 'ideas', 4, 250, 'Mike Maples Jr.'),
    b('The Underworld: Journeys to the Depths of the Ocean', ['escapist', 'ideas', 'nature'], 5, 250, 'Susan Casey'),
  ]),
  m(2024, 9, [b('Selling Sexy: Victoria\'s Secret and the Unraveling of an American Icon', ['history', 'ideas', 'life'], 4, 250, 'Lauren Sherman'), b('Legends & Lattes (Legends & Lattes, #1)', ['escapist', 'life', 'nature'], 5, 250, 'Travis Baldree')]),
  m(2024, 10, [
    b('Twelve Mile Bank (A.J. Bailey Adventure #1)', 'escapist', 3, 250, 'Nicholas Harvey'),
    b('Beached (A Mer Cavallo Mystery #2)', 'escapist', 3, 250, 'Micki Browning'),
    b('Adrift', 'escapist', 3, 250, 'Micki Browning'),
    b('The Girl Beneath the Sea (Underwater Investigation Unit, #1)', 'escapist', 3, 250, 'Andrew Mayne'),
    b('Playground', ['ideas', 'life', 'nature'], 3, 250, 'Richard Powers'),
    b('What You Are Looking for Is in the Library', 'life', 5, 250, 'Michiko Aoyama'),
  ]),
  m(2024, 11, [
    b('Things You Save in a Fire', 'life', 4, 250, 'Katherine Center'),
    b('Somewhere Beyond the Sea (Cerulean Chronicles, #2)', ['escapist', 'life'], 4, 250, 'T.J. Klune'),
    b('Wellness', ['history', 'life'], 4, 250, 'Nathan Hill'),
    b('A Walk in the Park: The True Story of a Spectacular Misadventure in the Grand Canyon', ['escapist', 'nature'], 4, 250, 'Kevin Fedarko'),
    b('The God of the Woods', ['escapist', 'life'], 5, 250, 'Liz Moore'),
    b('After I Do', 'life', 4, 250, 'Taylor Jenkins Reid'),
    b('Adrift: The Truth Won\'t Always Set You Free', 'escapist', 4, 250, 'Lisa Brideau'),
    b('Be Ready When the Luck Happens', ['life', 'nature'], 4, 250, 'Ina Garten'),
  ]),
  m(2025, 0, [
    b('Onyx Storm (The Empyrean, #3)', 'escapist', 4, 250, 'Rebecca Yarros'),
    b('Take the Lead: Hanging On, Letting Go, and Conquering Life\'s Hardest Climbs', ['escapist', 'life'], 3, 250, 'Sasha DiGiulian'),
    b('A Fire Endless (Elements of Cadence, #2)', ['escapist', 'life'], 4, 250, 'Rebecca Ross'),
    b('A River Enchanted (Elements of Cadence, #1)', ['escapist', 'life'], 5, 250, 'Rebecca Ross'),
    b('The Nvidia Way: Jensen Huang and the Making of a Tech Giant', 'ideas', 4, 250, 'Tae Kim'),
    b('The Spy and the Traitor: The Greatest Espionage Story of the Cold War', ['escapist', 'history', 'ideas'], 5, 250, 'Ben Macintyre'),
    b('The Charm School', ['escapist', 'history'], 4, 250, 'Nelson DeMille'),
  ]),
  m(2025, 1, [b('Society of Lies', 'escapist', 3, 250, 'Lauren Ling Brown'), b('The Will of the Many (Hierarchy, #1)', ['escapist', 'ideas'], 5, 250, 'James Islington')]),
  m(2025, 2, [
    b('Unmasking AI: My Mission to Protect What Is Human in a World of Machines', ['ideas', 'life'], 5, 250, 'Joy Buolamwini'),
    b('AI 2041: Ten Visions for Our Future', 'ideas', 3, 250, 'Kai-Fu Lee'),
    b('AI Superpowers: China, Silicon Valley, and the New World Order', ['history', 'ideas'], 3, 250, 'Kai-Fu Lee'),
    b('Wool (Wool, #1)', ['escapist', 'life'], 4, 250, 'Hugh Howey'),
    b('Source Code: My Beginnings', 'ideas', 4, 250, 'Bill Gates'),
    b('The Winemaker\'s Wife', ['history', 'life'], 4, 250, 'Kristin Harmel'),
    b('Co-Intelligence: Living and Working with AI', 'ideas', 5, 250, 'Ethan Mollick'),
    b('Cabin: Off the Grid Adventures with a Clueless Craftsman', ['escapist', 'life', 'nature'], 4, 250, 'Patrick Hutchison'),
  ]),
  m(2025, 3, [
    b('We Solve Murders (We Solve Murders, #1)', ['escapist', 'life'], 4, 250, 'Richard Osman'),
    b('Sea Power: The History and Geopolitics of the World\'s Oceans', ['history', 'nature'], 4, 250, 'James G. Stavridis'),
    b('The Wedding People', 'life', 5, 250, 'Alison Espach'),
    b('Timeless (Tropical Adventure #2)', ['escapist', 'history'], 3, 250, 'Wayne Stinnett'),
    b('Summer Island', 'life', 3, 250, 'Kristin Hannah'),
    b('The Quiet Librarian', 'escapist', 4, 250, 'Allen Eskens'),
    b('The Advocate\'s Devil (The Advocate\'s Devil, #1)', ['history', 'life'], 3, 250, 'Walter Woon'),
    b('Women & Power: A Manifesto', ['history', 'ideas'], 4, 250, 'Mary Beard'),
    b('A Well-Trained Wife: My Escape from Christian Patriarchy', 'life', 5, 250, 'Tia Levings'),
    b('Eruption', ['escapist', 'ideas'], 2, 250, 'Michael Crichton'),
    b('Graceless', 'life', 3, 250, 'Wayne Stinnett'),
    b('2034: A Novel of the Next World War', ['history', 'life'], 5, 250, 'Elliot Ackerman'),
    b('Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy', ['ideas', 'life'], 4, 250, 'Cathy O\'Neil'),
    b('How to End a Love Story', 'life', 3, 250, 'Yulin Kuang'),
  ]),
  m(2025, 4, [
    b('Mockingjay (The Hunger Games, #3)', ['escapist', 'life'], 3, 250, 'Suzanne Collins'),
    b('Catching Fire (The Hunger Games, #2)', ['escapist', 'life'], 5, 250, 'Suzanne Collins'),
    b('The Hunger Games (The Hunger Games, #1)', ['escapist', 'life'], 5, 250, 'Suzanne Collins'),
    b('The House of My Mother: A Daughter\'s Quest for Freedom', ['history', 'life'], 3, 250, 'Shari Franke'),
    b('Saving Five: A Memoir of Hope', 'life', 4, 250, 'Amanda Nguyen'),
    b('The Cartographers', ['escapist', 'history', 'life'], 4, 250, 'Peng Shepherd'),
  ]),
  m(2025, 5, [
    b('Empire of Storms (Throne of Glass, #5)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('Queen of Shadows (Throne of Glass, #4)', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Heir of Fire (Throne of Glass, #3)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('Crown of Midnight (Throne of Glass, #2)', ['escapist', 'life'], 5, 250, 'Sarah J. Maas'),
    b('Throne of Glass (Throne of Glass, #1)', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Throne of Glass', 'escapist', 4, 250, 'Sarah J. Maas'),
    b('Sunrise on the Reaping (The Hunger Games, #0.5)', ['escapist', 'life'], 4, 250, 'Suzanne Collins'),
    b('Ghost Fleet: A Novel of the Next World War', ['escapist', 'history', 'ideas'], 3, 250, 'P.W. Singer'),
    b('2054', ['history', 'life'], 3, 250, 'Elliot Ackerman'),
    b('All My Colors', ['history', 'life'], 2, 250, 'David Quantick'),
    b('Wordslut: A Feminist Guide to Taking Back the English Language', ['history', 'life'], 3, 250, 'Amanda Montell'),
  ]),
  m(2025, 6, [
    b('Carrie Soto Is Back', 'life', 5, 250, 'Taylor Jenkins Reid'),
    b('The Director', ['escapist', 'history', 'life'], 2, 250, 'David Ignatius'),
    b('Careless People: A Cautionary Tale of Power, Greed, and Lost Idealism', ['ideas', 'life'], 5, 250, 'Sarah Wynn-Williams'),
    b('Atmosphere', 'life', 5, 250, 'Taylor Jenkins Reid'),
    b('The Kamogawa Food Detectives (Kamogawa Food Detectives, #1)', ['life', 'nature'], 4, 250, 'Hisashi Kashiwai'),
    b('Kingdom of Ash (Throne of Glass, #7)', 'escapist', 5, 250, 'Sarah J. Maas'),
    b('Tower of Dawn (Throne of Glass, #6)', 'escapist', 4, 250, 'Sarah J. Maas'),
  ]),
  m(2025, 7, [
    b('The Dead Husband Cookbook', ['escapist', 'life'], 4, 250, 'Danielle Valentine'),
    b('The Other Side of Now', 'life', 3, 250, 'Paige Harbison'),
    b('Hunger Like a Thirst: From Food Stamps to Fine Dining, a Restaurant Critic Finds Her Place at the Table', ['history', 'nature'], 3, 250, 'Besha Rodell'),
    b('My Friends', 'life', 5, 250, 'Fredrik Backman'),
    b('Without Warning (J. B. Collins, #3)', 'escapist', 4, 250, 'Joel C. Rosenberg'),
    b('The First Hostage (J. B. Collins, #2)', 'escapist', 4, 250, 'Joel C. Rosenberg'),
    b('The Third Target (J. B. Collins #1)', ['escapist', 'history'], 4, 250, 'Joel C. Rosenberg'),
    b('Sea Kayaker\'s Deep Trouble: True Stories and Their Lessons from Sea Kayaker Magazine', ['escapist', 'ideas', 'nature'], 3, 250, 'Matt Broze'),
    b('The Singles Game', ['history', 'ideas'], 3, 250, 'Lauren Weisberger'),
  ]),
  m(2025, 8, [
    b('The Authenticity Project', 'life', 5, 250, 'Clare Pooley'),
    b('The Grand Paloma Resort', ['history', 'life'], 3, 250, 'Cleyvis Natera'),
    b('The Favorites', 'life', 4, 250, 'Layne Fargo'),
    b('The Seaweed Revolution: How Seaweed Has Shaped Our Past and Can Save Our Future', ['ideas', 'life', 'nature'], 3, 250, 'Vincent Doumeizel'),
    b('It\'s Only Drowning: A True Story of Learning to Surf and the Search for Common Ground', ['escapist', 'life'], 3, 250, 'David Litt'),
    b('Homewaters: A Human and Natural History of Puget Sound', ['history', 'life', 'nature'], 4, 250, 'David B. Williams'),
    b('She Didn\'t See It Coming', ['ideas', 'life'], 3, 250, 'Shari Lapena'),
    b('Squid Empire: The Rise and Fall of the Cephalopods', ['history', 'ideas'], 4, 250, 'Danna Staaf'),
    b('The First Gentleman', ['history', 'life'], 3, 250, 'Bill Clinton'),
  ]),
  m(2025, 9, [
    b('The Boys\' Club', ['history', 'life'], 4, 250, 'Erica Katz'),
    b('Murder Two Doors Down', 'escapist', 3, 250, 'Chuck Storla'),
    b('Invitation to a Banquet: The Story of Chinese Food', ['history', 'nature'], 5, 250, 'Fuchsia Dunlop'),
    b('17A Keong Saik Road', ['history', 'life'], 2, 250, 'Charmaine Leung'),
    b('Brave New World and Brave New World Revisited', ['history', 'life'], 5, 250, 'Aldous Huxley'),
    b('A Different Kind of Power', ['history', 'ideas', 'life'], 4, 250, 'Jacinda Ardern'),
  ]),
  m(2025, 10, [
    b('Gone Before Goodbye', 'life', 1, 250, 'Reese Witherspoon'),
    b('This American Woman: A One-in-a-Billion Memoir', ['history', 'life'], 5, 250, 'Zarna Garg'),
    b('Shark\'s Fin and Sichuan Pepper: A Sweet-Sour Memoir of Eating in China', ['history', 'nature'], 4, 250, 'Fuchsia Dunlop'),
    b('Culpability', ['ideas', 'life'], 5, 250, 'Bruce Holsinger'),
    b('The Academy', 'life', 3, 250, 'Elin Hilderbrand'),
    b('A Witch\'s Guide to Magical Innkeeping', ['escapist', 'life'], 5, 250, 'Sangu Mandanna'),
    b('The Correspondent', 'life', 5, 250, 'Virginia Evans'),
    b('The Guide', ['escapist', 'life'], 4, 250, 'Peter Heller'),
    b('HBR Guide to Generative AI for Managers', 'ideas', 3, 250, 'Elisa Farri'),
  ]),
  m(2025, 11, [
    b('The Amazing Adventures of Kavalier & Clay', ['escapist', 'history', 'life'], 5, 250, 'Michael Chabon'),
    b('Kitchen Confidential: Adventures in the Culinary Underbelly', ['history', 'life', 'nature'], 4, 250, 'Anthony Bourdain'),
    b('Ocean: Earth\'s Last Wilderness', ['ideas', 'life', 'nature'], 4, 250, 'David Attenborough'),
    b('Ocean: Earth’s Last Wilderness', ['history', 'life', 'nature'], 4, 250, 'David Attenborough'),
    b('A Marriage at Sea: A True Story of Love, Obsession, and Shipwreck', ['escapist', 'life', 'nature'], 4, 250, 'Sophie Elmhirst'),
    b('Beating the Algorithm: Overriding the Script of Life', ['ideas', 'life'], 4, 250, 'Cheo Ming Shen'),
    b('The Compound', 'life', 3, 250, 'Aisling Rawle'),
    b('The Magician\'s Assistant', 'life', 3, 250, 'Ann Patchett'),
    b('The Strength of the Few (Hierarchy, #2)', 'escapist', 4, 250, 'James Islington'),
    b('The Stationery Shop', ['history', 'life'], 4, 250, 'Marjan Kamali'),
    b('Flesh', 'life', 2, 250, 'David Szalay'),
    b('The Ocean\'s Menagerie: How Earth\'s Strangest Creatures Reshape the Rules of Life', ['ideas', 'nature'], 4, 250, 'Drew Harvell'),
    b('Beautyland', 'life', 4, 250, 'Marie-Helene Bertino'),
    b('Make it a Double: From Wretched to Wondrous: Tales of One Woman\'s Lifelong Discovery of Whisky', 'nature', 2, 250, 'Shelley Sackier'),
  ]),
  m(2026, 0, [
    b('Moderation', ['history', 'life'], 3, 250, 'Elaine Castillo'),
    b('The Loneliness of Sonia and Sunny', 'life', 3, 250, 'Kiran Desai'),
    b('My Mexico City Kitchen: Recipes and Convictions', ['history', 'life', 'nature'], 5, 250, 'Gabriela Camara'),
    b('Like Water for Chocolate', ['history', 'life'], 5, 250, 'Laura Esquivel; Carol and Tom Christensen [trans]'),
    b('Bird by Bird', 'life', 3, 250, 'Anne Lamott'),
    b('Empire of AI: Dreams and Nightmares in Sam Altman\'s OpenAI', ['ideas', 'life'], 5, 250, 'Karen Hao'),
    b('Beasts of a Little Land', ['history', 'life'], 3, 250, 'Juhea Kim'),
    b('Is a River Alive?', ['ideas', 'life', 'nature'], 5, 250, 'Robert Macfarlane'),
    b('King of Kings: The Iranian Revolution—A Story of Hubris, Delusion and Catastrophic Miscalculation', ['history', 'ideas'], 5, 250, 'Scott Anderson'),
    b('The Road to Tender Hearts', 'life', 3, 250, 'Annie Hartnett'),
    b('Mother Mary Comes to Me', ['history', 'life'], 3, 250, 'Arundhati Roy'),
    b('House of Huawei: The Secret History of China\'s Most Powerful Company', ['history', 'ideas'], 5, 250, 'Eva Dou'),
    b('The Troublemaker: How Jimmy Lai Became a Billionaire, Hong Kong\'s Greatest Dissident, and China\'s Most Feared Critic', 'history', 3, 250, 'Mark L. Clifford'),
  ]),
  m(2026, 1, [
    b('Smoke and Pickles: Recipes and Stories from a New Southern Kitchen', ['history', 'nature'], 3, 250, 'Edward Lee'),
    b('Buttermilk Graffiti: A Chef’s Journey to Discover America’s New Melting-Pot Cuisine', ['history', 'nature'], 4, 250, 'Edward Lee'),
    b('Unreasonable Hospitality: The Remarkable Power of Giving People More Than They Expect', ['ideas', 'life'], 5, 250, 'Will Guidara'),
    b('Airplane Mode: An Irreverent History of Travel', ['history', 'life', 'nature'], 3, 250, 'Shahnaz Habib'),
  ]),
  m(2026, 2, [
    b('Thirty Below: The Harrowing and Heroic Story of the First All-Women\'s Ascent of Denali', ['escapist', 'history'], 3, 250, 'Cassidy Randall'),
    b('Breakneck: China\'s Quest to Engineer the Future', ['history', 'ideas'], 5, 250, 'Dan Wang'),
    b('The Spies of Shilling Lane', ['history', 'life'], 2, 250, 'Jennifer Ryan'),
    b('Kook: What Surfing Taught Me About Love, Life, and Catching the Perfect Wave', ['life', 'nature'], 3, 250, 'Peter Heller'),
    b('So Old, So Young', 'life', 3, 250, 'Grant Ginder'),
    b('Genius Makers: The Mavericks Who Brought AI to Google, Facebook, and the World', ['history', 'ideas'], 5, 250, 'Cade Metz'),
  ]),];

export const totalPages = (d: MonthData) => d.books.reduce((a, b) => a + b.pages, 0);

export const avgRating = (d: MonthData) => {
  if (d.books.length === 0) return 0;
  return d.books.reduce((a, b) => a + b.rating, 0) / d.books.length;
};

export const getYears = () => [...new Set(readingData.map(d => d.year))].sort();

export const toMonthIndex = (d: MonthData) => (d.year - 2021) * 12 + d.month;
