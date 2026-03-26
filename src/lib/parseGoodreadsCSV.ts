import { MonthData, VibeGroup, Book } from '@/data/readingData';

/**
 * Parse a Goodreads CSV export into MonthData[].
 *
 * Expected columns (case-insensitive):
 *  - Title
 *  - Author (or Author l-f)
 *  - Number of Pages
 *  - My Rating
 *  - Date Read (or Date Added as fallback)
 *  - Exclusive Shelf (read, currently-reading, to-read)
 *  - Bookshelves (used for vibe tagging)
 */

const SHELF_TO_VIBE: [RegExp, VibeGroup][] = [
  [/fantasy|sci-?fi|fiction|adventure|thriller|mystery|romance|horror|comic|graphic/i, 'escapist'],
  [/tech|science|philosophy|business|economics|psychology|self-help|programming|ai|computer/i, 'ideas'],
  [/nature|environment|ocean|sea|outdoor|animal|ecology|climate|garden/i, 'nature'],
  [/history|politic|war|biography|sociology|anthropolog|culture|religion/i, 'history'],
  [/memoir|autobiograph|essay|personal|diary|journal|life|poetry/i, 'memoir'],
];

function guessVibe(shelves: string, title: string): VibeGroup {
  const text = `${shelves} ${title}`.toLowerCase();
  for (const [re, vibe] of SHELF_TO_VIBE) {
    if (re.test(text)) return vibe;
  }
  return 'escapist'; // default
}

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseGoodreadsCSV(csvText: string): MonthData[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVRow(headerLine).map(h => h.toLowerCase().replace(/"/g, ''));

  const col = (name: string) => headers.findIndex(h => h.includes(name));

  const iTitle = col('title');
  const iAuthor = Math.max(col('author l-f'), col('author'));
  const iPages = col('number of pages');
  const iRating = col('my rating');
  const iDateRead = col('date read');
  const iDateAdded = col('date added');
  const iShelf = col('exclusive shelf');
  const iShelves = col('bookshelves');

  if (iTitle === -1) {
    console.warn('CSV missing Title column');
    return [];
  }

  const monthMap = new Map<string, Book[]>();

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCSVRow(lines[r]);
    if (cells.length < 3) continue;

    const shelf = cells[iShelf]?.toLowerCase() || '';
    if (shelf === 'to-read' || shelf === 'currently-reading') continue;

    const title = cells[iTitle]?.replace(/"/g, '') || 'Untitled';
    const author = cells[iAuthor]?.replace(/"/g, '') || '';
    const pages = parseInt(cells[iPages]) || 250;
    const rating = parseInt(cells[iRating]) || 3;
    const shelves = cells[iShelves] || '';

    // Parse date
    let dateStr = cells[iDateRead] || cells[iDateAdded] || '';
    dateStr = dateStr.replace(/"/g, '').trim();
    if (!dateStr) continue;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    const vibe = guessVibe(shelves, title);

    const book: Book = { title, author, vibe, rating: Math.min(5, Math.max(1, rating)), pages };

    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(book);
  }

  const result: MonthData[] = [];
  monthMap.forEach((books, key) => {
    const [y, m] = key.split('-').map(Number);
    result.push({ year: y, month: m, books });
  });

  result.sort((a, b) => a.year - b.year || a.month - b.month);
  return result;
}
