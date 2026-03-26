export type Genre = 'fiction' | 'nonfiction' | 'scifi' | 'poetry' | 'history';

export interface Book {
  title: string;
  author: string;
  genre: Genre;
  rating: number; // 1-5
  pages: number;
}

export interface MonthData {
  month: string;
  shortMonth: string;
  books: Book[];
  totalPages: number;
}

export const genreLabels: Record<Genre, string> = {
  fiction: 'Fiction',
  nonfiction: 'Non-Fiction',
  scifi: 'Sci-Fi',
  poetry: 'Poetry',
  history: 'History',
};

export const genreColorVars: Record<Genre, string> = {
  fiction: 'var(--river-fiction)',
  nonfiction: 'var(--river-nonfiction)',
  scifi: 'var(--river-scifi)',
  poetry: 'var(--river-poetry)',
  history: 'var(--river-history)',
};

export const readingData: MonthData[] = [
  {
    month: 'January', shortMonth: 'Jan',
    totalPages: 820,
    books: [
      { title: 'The Goldfinch', author: 'Donna Tartt', genre: 'fiction', rating: 5, pages: 380 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'nonfiction', rating: 4, pages: 290 },
      { title: 'Ariel', author: 'Sylvia Plath', genre: 'poetry', rating: 5, pages: 150 },
    ],
  },
  {
    month: 'February', shortMonth: 'Feb',
    totalPages: 650,
    books: [
      { title: 'Dune', author: 'Frank Herbert', genre: 'scifi', rating: 5, pages: 410 },
      { title: 'Salt', author: 'Mark Kurlansky', genre: 'history', rating: 3, pages: 240 },
    ],
  },
  {
    month: 'March', shortMonth: 'Mar',
    totalPages: 1100,
    books: [
      { title: 'Normal People', author: 'Sally Rooney', genre: 'fiction', rating: 4, pages: 260 },
      { title: 'Neuromancer', author: 'William Gibson', genre: 'scifi', rating: 4, pages: 270 },
      { title: 'Educated', author: 'Tara Westover', genre: 'nonfiction', rating: 5, pages: 330 },
      { title: 'The Waste Land', author: 'T.S. Eliot', genre: 'poetry', rating: 5, pages: 240 },
    ],
  },
  {
    month: 'April', shortMonth: 'Apr',
    totalPages: 480,
    books: [
      { title: 'The Road', author: 'Cormac McCarthy', genre: 'fiction', rating: 5, pages: 290 },
      { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', genre: 'history', rating: 4, pages: 190 },
    ],
  },
  {
    month: 'May', shortMonth: 'May',
    totalPages: 920,
    books: [
      { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', genre: 'scifi', rating: 4, pages: 300 },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', genre: 'nonfiction', rating: 4, pages: 350 },
      { title: 'Milk and Honey', author: 'Rupi Kaur', genre: 'poetry', rating: 3, pages: 270 },
    ],
  },
  {
    month: 'June', shortMonth: 'Jun',
    totalPages: 1350,
    books: [
      { title: 'Circe', author: 'Madeline Miller', genre: 'fiction', rating: 5, pages: 390 },
      { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'scifi', rating: 5, pages: 470 },
      { title: 'SPQR', author: 'Mary Beard', genre: 'history', rating: 4, pages: 290 },
      { title: 'Devotions', author: 'Mary Oliver', genre: 'poetry', rating: 5, pages: 200 },
    ],
  },
  {
    month: 'July', shortMonth: 'Jul',
    totalPages: 560,
    books: [
      { title: 'The Bell Jar', author: 'Sylvia Plath', genre: 'fiction', rating: 4, pages: 240 },
      { title: 'Atomic Habits', author: 'James Clear', genre: 'nonfiction', rating: 4, pages: 320 },
    ],
  },
  {
    month: 'August', shortMonth: 'Aug',
    totalPages: 980,
    books: [
      { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'scifi', rating: 5, pages: 280 },
      { title: 'A Room of One\'s Own', author: 'Virginia Woolf', genre: 'nonfiction', rating: 5, pages: 190 },
      { title: 'The Silk Roads', author: 'Peter Frankopan', genre: 'history', rating: 4, pages: 510 },
    ],
  },
  {
    month: 'September', shortMonth: 'Sep',
    totalPages: 730,
    books: [
      { title: 'Hamnet', author: 'Maggie O\'Farrell', genre: 'fiction', rating: 5, pages: 370 },
      { title: 'Howl', author: 'Allen Ginsberg', genre: 'poetry', rating: 4, pages: 120 },
      { title: 'Brief Answers', author: 'Stephen Hawking', genre: 'nonfiction', rating: 3, pages: 240 },
    ],
  },
  {
    month: 'October', shortMonth: 'Oct',
    totalPages: 1200,
    books: [
      { title: 'Piranesi', author: 'Susanna Clarke', genre: 'fiction', rating: 5, pages: 250 },
      { title: 'The Dispossessed', author: 'Ursula K. Le Guin', genre: 'scifi', rating: 5, pages: 380 },
      { title: 'The Guns of August', author: 'Barbara Tuchman', genre: 'history', rating: 5, pages: 310 },
      { title: 'Bluets', author: 'Maggie Nelson', genre: 'poetry', rating: 4, pages: 260 },
    ],
  },
  {
    month: 'November', shortMonth: 'Nov',
    totalPages: 600,
    books: [
      { title: 'Beloved', author: 'Toni Morrison', genre: 'fiction', rating: 5, pages: 320 },
      { title: 'Quiet', author: 'Susan Cain', genre: 'nonfiction', rating: 3, pages: 280 },
    ],
  },
  {
    month: 'December', shortMonth: 'Dec',
    totalPages: 1050,
    books: [
      { title: 'The Overstory', author: 'Richard Powers', genre: 'fiction', rating: 5, pages: 500 },
      { title: 'Exhalation', author: 'Ted Chiang', genre: 'scifi', rating: 5, pages: 350 },
      { title: 'Night Sky', author: 'Ocean Vuong', genre: 'poetry', rating: 5, pages: 200 },
    ],
  },
];
