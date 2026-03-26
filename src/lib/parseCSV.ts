import { parse } from 'date-fns';
import { MonthData, Book, VibeGroup, tagsToVibes } from '@/data/readingData';

/** Parse a single CSV row handling quoted fields */
export function parseCSVRow(line: string): string[] {
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

/** Parse full CSV text into headers + rows */
export function parseCSVText(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Remove BOM
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVRow(headerLine).map(h => h.replace(/"/g, ''));
  const rows = lines.slice(1).map(l => parseCSVRow(l));
  return { headers, rows };
}

export interface ColumnMapping {
  title: number;
  date: number;
  rating: number;
  vibes: number;
  author?: number;
}

/** Try common date formats */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/"/g, '').trim();
  if (!cleaned) return null;

  // Try "Month Day, Year" format (e.g. "March 23, 2026")
  const formats = [
    'MMMM d, yyyy',
    'MMMM dd, yyyy',
    'MMM d, yyyy',
    'MMM dd, yyyy',
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
  ];

  for (const fmt of formats) {
    try {
      const d = parse(cleaned, fmt, new Date());
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
    } catch {
      // try next
    }
  }

  // Fallback: native Date
  const native = new Date(cleaned);
  if (!isNaN(native.getTime()) && native.getFullYear() > 1900) return native;
  return null;
}

export interface ParsedBook {
  title: string;
  author: string;
  dateRead: Date;
  rating: number;
  vibes: VibeGroup[];
  rawVibes: string;
}

/** Parse CSV rows with column mapping into structured books */
export function parseMappedCSV(
  rows: string[][],
  mapping: ColumnMapping
): ParsedBook[] {
  const books: ParsedBook[] = [];

  for (const cells of rows) {
    if (cells.length < 3) continue;

    const title = (cells[mapping.title] || '').replace(/"/g, '').trim();
    if (!title) continue;

    const dateStr = cells[mapping.date] || '';
    const date = parseDate(dateStr);
    if (!date) continue;

    const ratingRaw = parseInt(cells[mapping.rating] || '3');
    const rating = Math.min(5, Math.max(1, isNaN(ratingRaw) ? 3 : ratingRaw));

    const vibeStr = cells[mapping.vibes] || '';
    const vibes = tagsToVibes(vibeStr);

    const author = mapping.author !== undefined ? (cells[mapping.author] || '').replace(/"/g, '').trim() : '';

    books.push({ title, author, dateRead: date, rating, vibes, rawVibes: vibeStr });
  }

  return books;
}

/** Group parsed books into MonthData[] */
export function booksToMonthData(parsedBooks: ParsedBook[]): MonthData[] {
  const monthMap = new Map<string, Book[]>();

  for (const pb of parsedBooks) {
    const year = pb.dateRead.getFullYear();
    const month = pb.dateRead.getMonth();
    const key = `${year}-${month}`;

    const book: Book = {
      title: pb.title,
      author: pb.author,
      vibes: pb.vibes,
      rating: pb.rating,
      pages: 250, // default since CSV may not have pages
    };

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
