import { useState, useMemo } from 'react';
import { readingData, Genre, genreLabels } from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const GENRES: Genre[] = ['fiction', 'nonfiction', 'scifi', 'poetry', 'history'];

const genreHSL: Record<Genre, string> = {
  fiction: 'hsl(187, 55%, 35%)',
  nonfiction: 'hsl(24, 60%, 50%)',
  scifi: 'hsl(260, 40%, 50%)',
  poetry: 'hsl(340, 45%, 52%)',
  history: 'hsl(45, 50%, 45%)',
};

const SVG_W = 1100;
const SVG_H = 520;
const PAD_X = 80;
const PAD_Y = 60;
const RIVER_MAX_W = 120;

const RiverOfReading = () => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const maxPages = useMemo(() => Math.max(...readingData.map(m => m.totalPages)), []);

  const monthX = (i: number) => PAD_X + (i / (readingData.length - 1)) * (SVG_W - PAD_X * 2);
  const centerY = SVG_H / 2;

  // Compute stacked genre widths per month
  const monthStacks = useMemo(() => {
    return readingData.map(month => {
      const totalW = (month.totalPages / maxPages) * RIVER_MAX_W;
      const genreCounts: Record<Genre, number> = { fiction: 0, nonfiction: 0, scifi: 0, poetry: 0, history: 0 };
      month.books.forEach(b => { genreCounts[b.genre] += b.pages; });
      const total = Object.values(genreCounts).reduce((a, b) => a + b, 0) || 1;
      let offset = 0;
      const layers = GENRES.map(g => {
        const w = (genreCounts[g] / total) * totalW;
        const layer = { genre: g, y: centerY - totalW / 2 + offset, height: w };
        offset += w;
        return layer;
      }).filter(l => l.height > 0);
      return { totalW, layers };
    });
  }, [maxPages]);

  // Build smooth paths for each genre
  const genrePaths = useMemo(() => {
    return GENRES.map(genre => {
      const topPoints: { x: number; y: number }[] = [];
      const bottomPoints: { x: number; y: number }[] = [];

      readingData.forEach((_, i) => {
        const x = monthX(i);
        const stack = monthStacks[i];
        const layer = stack.layers.find(l => l.genre === genre);
        if (layer) {
          topPoints.push({ x, y: layer.y });
          bottomPoints.push({ x, y: layer.y + layer.height });
        } else {
          // Genre not present — collapse to center of river
          topPoints.push({ x, y: centerY });
          bottomPoints.push({ x, y: centerY });
        }
      });

      // Build smooth area path
      const catmull = (pts: { x: number; y: number }[]) => {
        if (pts.length < 2) return '';
        let d = `M${pts[0].x},${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(i - 1, 0)];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[Math.min(i + 2, pts.length - 1)];
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        return d;
      };

      const topPath = catmull(topPoints);
      const revBottom = [...bottomPoints].reverse();
      const bottomPath = catmull(revBottom);

      // Combine into closed area
      const last = topPoints[topPoints.length - 1];
      const firstRev = revBottom[0];
      const fullPath = `${topPath} L${last.x},${last.y} L${firstRev.x},${firstRev.y} ${bottomPath.replace(/^M[^ ]+/, '')} Z`;

      return { genre, path: fullPath };
    });
  }, [monthStacks]);

  // Tributary lines coming from edges
  const tributaryPaths = useMemo(() => {
    const tribs: { d: string; genre: Genre; monthIdx: number }[] = [];
    readingData.forEach((month, i) => {
      const x = monthX(i);
      const stack = monthStacks[i];

      month.books.forEach((book, bi) => {
        const layer = stack.layers.find(l => l.genre === book.genre);
        if (!layer) return;
        const entryY = layer.y + layer.height / 2;
        const side = bi % 2 === 0 ? -1 : 1;
        const startY = side === -1 ? PAD_Y - 20 : SVG_H - PAD_Y + 20;
        const startX = x + (bi - month.books.length / 2) * 12;
        const cpY = entryY + (startY - entryY) * 0.4;
        tribs.push({
          d: `M${startX},${startY} Q${startX},${cpY} ${x},${entryY}`,
          genre: book.genre,
          monthIdx: i,
        });
      });
    });
    return tribs;
  }, [monthStacks]);

  const handleMonthHover = (i: number, e: React.MouseEvent<SVGElement>) => {
    const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (!svgRect) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2 - svgRect.left + (svgRect.left - (e.currentTarget.closest('.river-container') as HTMLElement)?.getBoundingClientRect().left || 0),
      y: rect.top - svgRect.top,
    });
    setHoveredMonth(i);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      {/* Header */}
      <header className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
          River of Reading
        </h1>
        <p className="text-muted-foreground text-base md:text-lg font-light">
          A year's journey through pages — hover any month to reveal composition
        </p>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        {GENRES.map(g => (
          <div key={g} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: genreHSL[g] }}
            />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {genreLabels[g]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-4">
          <span className="text-xs text-muted-foreground italic">5★ pulse on hover</span>
        </div>
      </div>

      {/* River SVG */}
      <div className="river-container relative w-full max-w-[1100px] overflow-visible">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Topo grid pattern */}
            <pattern id="topo" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.5" fill="hsl(200, 10%, 75%)" opacity="0.3" />
            </pattern>
            {/* Flow animation dash */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Topo background */}
          <rect width={SVG_W} height={SVG_H} fill="url(#topo)" />

          {/* Tributary lines */}
          {tributaryPaths.map((trib, i) => (
            <path
              key={`trib-${i}`}
              d={trib.d}
              fill="none"
              stroke={genreHSL[trib.genre]}
              strokeWidth={hoveredMonth === trib.monthIdx ? 2.5 : 1.2}
              strokeDasharray={hoveredMonth === trib.monthIdx ? 'none' : '4 4'}
              opacity={hoveredMonth === null ? 0.25 : hoveredMonth === trib.monthIdx ? 0.7 : 0.1}
              className="transition-all duration-300"
            />
          ))}

          {/* Genre stacked areas */}
          {genrePaths.map(({ genre, path }) => (
            <path
              key={genre}
              d={path}
              fill={genreHSL[genre]}
              opacity={0.75}
              className="transition-opacity duration-300"
              style={{
                filter: hoveredMonth !== null ? undefined : 'url(#glow)',
              }}
            />
          ))}

          {/* Centerline */}
          <line
            x1={PAD_X}
            y1={centerY}
            x2={SVG_W - PAD_X}
            y2={centerY}
            stroke="hsl(200, 10%, 70%)"
            strokeWidth="0.5"
            strokeDasharray="6 4"
            opacity="0.4"
          />

          {/* Month markers */}
          {readingData.map((month, i) => {
            const x = monthX(i);
            const stack = monthStacks[i];
            const topY = centerY - stack.totalW / 2;
            const bottomY = centerY + stack.totalW / 2;
            const isHovered = hoveredMonth === i;

            return (
              <g
                key={month.month}
                onMouseEnter={(e) => handleMonthHover(i, e)}
                onMouseLeave={() => setHoveredMonth(null)}
                className="cursor-pointer"
              >
                {/* Invisible wider hit area */}
                <rect
                  x={x - 30}
                  y={PAD_Y}
                  width={60}
                  height={SVG_H - PAD_Y * 2}
                  fill="transparent"
                />

                {/* Vertical scan line */}
                <line
                  x1={x}
                  y1={topY - 10}
                  x2={x}
                  y2={bottomY + 10}
                  stroke="hsl(var(--foreground))"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={isHovered ? 0.6 : 0.15}
                  className="transition-all duration-200"
                />

                {/* Top marker dot */}
                <circle
                  cx={x}
                  cy={topY - 10}
                  r={isHovered ? 4 : 2}
                  fill={isHovered ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  className="transition-all duration-200"
                />

                {/* Month label */}
                <text
                  x={x}
                  y={SVG_H - 20}
                  textAnchor="middle"
                  className="transition-all duration-200"
                  fill={isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                  fontSize={isHovered ? 13 : 11}
                  fontWeight={isHovered ? 700 : 400}
                  fontFamily="'Source Sans 3', sans-serif"
                >
                  {month.shortMonth}
                </text>

                {/* Pages label on hover */}
                {isHovered && (
                  <text
                    x={x}
                    y={bottomY + 28}
                    textAnchor="middle"
                    fill="hsl(var(--primary))"
                    fontSize={10}
                    fontWeight={600}
                    fontFamily="'Source Sans 3', sans-serif"
                    className="animate-topo-fade"
                  >
                    {month.totalPages.toLocaleString()} pages
                  </text>
                )}
              </g>
            );
          })}

          {/* Genesis label at river start */}
          <text
            x={PAD_X - 10}
            y={centerY + 4}
            textAnchor="end"
            fill="hsl(var(--muted-foreground))"
            fontSize={10}
            fontStyle="italic"
            fontFamily="'Playfair Display', serif"
          >
            tributary genesis
          </text>
        </svg>

        {/* Tooltip overlay */}
        {hoveredMonth !== null && (() => {
          const pct = (monthX(hoveredMonth) / SVG_W) * 100;
          const stack = monthStacks[hoveredMonth];
          const topY = (centerY - stack.totalW / 2 - 10) / SVG_H * 100;
          return (
            <MonthTooltip
              data={readingData[hoveredMonth]}
              x={`${pct}%`}
              y={`${topY}%` as unknown as number}
            />
          );
        })()}
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-8 mt-10 justify-center">
        {[
          { label: 'Books Read', value: readingData.reduce((a, m) => a + m.books.length, 0) },
          { label: 'Total Pages', value: readingData.reduce((a, m) => a + m.totalPages, 0).toLocaleString() },
          { label: '5★ Books', value: readingData.reduce((a, m) => a + m.books.filter(b => b.rating === 5).length, 0) },
          { label: 'Genres', value: GENRES.length },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-foreground font-serif">{stat.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiverOfReading;
