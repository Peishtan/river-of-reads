import { useState, useMemo, useCallback, useRef } from 'react';
import {
  readingData, VibeGroup, vibeLabels, vibeHSL,
  totalPages, avgRating, monthLabelFull,
  getYears, toMonthIndex,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history'];

const SVG_W = 1400;
const SVG_H = 480;
const PAD_L = 60;
const PAD_R = 140;
const PAD_T = 70;
const PAD_B = 60;
const RIVER_CENTER = SVG_H / 2 + 10;
const MAX_RIVER_W = 100; // max half-width of main river

const RiverOfReading = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => getYears(), []);
  const totalMonths = useMemo(() => (years[years.length - 1] - years[0]) * 12 + 3, [years]);

  const xScale = useCallback((monthIdx: number) => {
    return PAD_L + (monthIdx / totalMonths) * (SVG_W - PAD_L - PAD_R);
  }, [totalMonths]);

  const maxPages = useMemo(() => Math.max(...readingData.map(totalPages)), []);

  // Width of river at each data point (proportional to pages)
  const riverWidth = useCallback((pages: number) => {
    return Math.max(12, (pages / maxPages) * MAX_RIVER_W);
  }, [maxPages]);

  // Build interpolated river points for smooth flow
  const riverPoints = useMemo(() => {
    return readingData.map((d) => {
      const mi = toMonthIndex(d);
      const x = xScale(mi);
      const w = riverWidth(totalPages(d));

      // Per-vibe breakdown
      const tp = totalPages(d) || 1;
      const vibePages: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0 };
      d.books.forEach(b => { vibePages[b.vibe] += b.pages; });

      // Stack positions (from top of river downward)
      let offset = 0;
      const vibeStacks = VIBES.map(v => {
        const h = (vibePages[v] / tp) * w * 2;
        const entry = { vibe: v, yOffset: offset, height: h };
        offset += h;
        return entry;
      }).filter(s => s.height > 0);

      return { x, w, mi, data: d, vibeStacks, vibePages };
    });
  }, [xScale, maxPages]);

  // Catmull-Rom helper
  const catmullPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  // Build main river area (filled between top and bottom curves)
  const mainRiverPath = useMemo(() => {
    const topPts = riverPoints.map(p => ({ x: p.x, y: RIVER_CENTER - p.w }));
    const botPts = riverPoints.map(p => ({ x: p.x, y: RIVER_CENTER + p.w }));
    const topD = catmullPath(topPts);
    const botPtsRev = [...botPts].reverse();
    const botD = catmullPath(botPtsRev);
    const last = topPts[topPts.length - 1];
    const firstRev = botPtsRev[0];
    return `${topD} L${last.x.toFixed(1)},${last.y.toFixed(1)} L${firstRev.x.toFixed(1)},${firstRev.y.toFixed(1)} ${botD.replace(/^M[^ ]+/, '')} Z`;
  }, [riverPoints]);

  // Tributary paths - each vibe flows as a visible stream branching from edges
  const tributaryPaths = useMemo(() => {
    return VIBES.map(vibe => {
      // This vibe's share at each data point, as offset from river center
      const tribPts: { x: number; yTop: number; yBot: number }[] = [];

      riverPoints.forEach(rp => {
        const stack = rp.vibeStacks.find(s => s.vibe === vibe);
        if (stack && stack.height > 1) {
          const yTop = RIVER_CENTER - rp.w + stack.yOffset;
          tribPts.push({ x: rp.x, yTop, yBot: yTop + stack.height });
        } else {
          tribPts.push({ x: rp.x, yTop: RIVER_CENTER, yBot: RIVER_CENTER });
        }
      });

      const topPath = catmullPath(tribPts.map(p => ({ x: p.x, y: p.yTop })));
      const botPtsRev = [...tribPts].reverse();
      const botPath = catmullPath(botPtsRev.map(p => ({ x: p.x, y: p.yBot })));

      const last = tribPts[tribPts.length - 1];
      const firstRev = botPtsRev[0];
      const fullPath = `${topPath} L${last.x.toFixed(1)},${last.yTop.toFixed(1)} L${firstRev.x.toFixed(1)},${firstRev.yBot.toFixed(1)} ${botPath.replace(/^M[^ ]+/, '')} Z`;

      return { vibe, path: fullPath };
    });
  }, [riverPoints]);

  // Annotations (book labels along the river)
  const annotations = useMemo(() => {
    const annots: { x: number; y: number; text: string; }[] = [];
    riverPoints.forEach((rp, idx) => {
      rp.data.books.forEach((book, bi) => {
        if (book.annotation) {
          const side = idx % 2 === 0 ? -1 : 1;
          const yOff = side * (rp.w + 18 + bi * 14);
          annots.push({
            x: rp.x,
            y: RIVER_CENTER + yOff,
            text: book.annotation,
          });
        }
      });
    });
    return annots;
  }, [riverPoints]);

  // 5-star books positions for gold pulses
  const fiveStarPositions = useMemo(() => {
    const positions: { x: number; y: number; monthDataIdx: number }[] = [];
    riverPoints.forEach((rp, rpIdx) => {
      rp.data.books.forEach((book, bi) => {
        if (book.rating === 5) {
          const angle = (bi / rp.data.books.length) * Math.PI * 2;
          const spread = rp.w * 0.5;
          positions.push({
            x: rp.x + Math.cos(angle) * spread * 0.3,
            y: RIVER_CENTER + Math.sin(angle) * spread,
            monthDataIdx: rpIdx,
          });
        }
      });
    });
    return positions;
  }, [riverPoints]);

  // Year x positions
  const yearPositions = useMemo(() => {
    return years.map(y => ({
      year: y,
      x: xScale((y - 2021) * 12),
    }));
  }, [years, xScale]);

  // Tooltip position calculation
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number } | null>(null);

  const handleHover = (idx: number, e: React.MouseEvent) => {
    setHoveredIdx(idx);
    const rp = riverPoints[idx];
    // Percentage-based positioning
    const xPct = (rp.x / SVG_W) * 100;
    const yPct = ((RIVER_CENTER - rp.w - 20) / SVG_H) * 100;
    setTooltipInfo({ x: xPct, y: yPct });
  };

  const handleLeave = () => {
    setHoveredIdx(null);
    setTooltipInfo(null);
  };

  // Per-year book counts at bottom
  const yearBookCounts = useMemo(() => {
    return years.map(y => {
      const count = readingData
        .filter(d => d.year === y)
        .reduce((a, d) => a + d.books.length, 0);
      return { year: y, count };
    });
  }, [years]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-2 py-8 overflow-x-auto">
      {/* Header */}
      <header className="text-center mb-6 max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.15em] uppercase mb-1">
          RIVER OF READING
        </h1>
        <p className="text-sm text-primary font-light tracking-wide">
          A Navigational Log of Peishan's books — 2021 to present · width = volume · depth of colour = avg rating
        </p>
      </header>

      {/* River SVG */}
      <div ref={containerRef} className="relative w-full max-w-[1400px]" style={{ minWidth: 900 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="river-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="river-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(180, 40%, 22%)" />
              <stop offset="50%" stopColor="hsl(175, 50%, 30%)" />
              <stop offset="100%" stopColor="hsl(172, 45%, 35%)" />
            </linearGradient>
          </defs>

          {/* Year markers */}
          {yearPositions.map(yp => (
            <g key={yp.year}>
              <line
                x1={yp.x} y1={PAD_T - 10}
                x2={yp.x} y2={SVG_H - PAD_B + 10}
                stroke="hsl(200, 10%, 25%)"
                strokeWidth="0.5"
                strokeDasharray="4 6"
              />
              <text
                x={yp.x} y={PAD_T - 20}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="15"
                fontWeight="600"
                fontFamily="'Source Sans 3', sans-serif"
              >
                {yp.year}
              </text>
            </g>
          ))}

          {/* Main river body */}
          <path
            d={mainRiverPath}
            fill="url(#river-grad)"
            opacity="0.5"
            filter="url(#river-glow)"
          />

          {/* Vibe tributary layers */}
          {tributaryPaths.map(({ vibe, path }) => (
            <path
              key={vibe}
              d={path}
              fill={vibeHSL[vibe]}
              opacity={0.65}
              className="transition-opacity duration-300"
            />
          ))}

          {/* River edge highlight lines */}
          {(() => {
            const topPts = riverPoints.map(p => ({ x: p.x, y: RIVER_CENTER - p.w }));
            const botPts = riverPoints.map(p => ({ x: p.x, y: RIVER_CENTER + p.w }));
            return (
              <>
                <path d={catmullPath(topPts)} fill="none" stroke="hsl(176, 50%, 50%)" strokeWidth="1" opacity="0.4" />
                <path d={catmullPath(botPts)} fill="none" stroke="hsl(176, 50%, 50%)" strokeWidth="1" opacity="0.4" />
              </>
            );
          })()}

          {/* Annotations */}
          {annotations.map((a, i) => (
            <text
              key={i}
              x={a.x}
              y={a.y}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
              fontStyle="italic"
              fontFamily="'Source Sans 3', sans-serif"
              opacity="0.7"
            >
              {a.text.split('\n').map((line, li) => (
                <tspan key={li} x={a.x} dy={li === 0 ? 0 : 12}>{line}</tspan>
              ))}
            </text>
          ))}

          {/* 5-star gold pulse rings */}
          {fiveStarPositions.map((pos, i) => {
            const isActive = hoveredIdx === pos.monthDataIdx;
            return (
              <g key={`star-${i}`}>
                <circle
                  cx={pos.x} cy={pos.y}
                  r={3}
                  fill="hsl(var(--gold-bright))"
                  opacity={isActive ? 1 : 0.6}
                  className="transition-opacity duration-200"
                />
                {isActive && (
                  <>
                    <circle
                      cx={pos.x} cy={pos.y}
                      r={4}
                      fill="none"
                      stroke="hsl(var(--gold-bright))"
                      strokeWidth="2"
                      opacity="0.8"
                    >
                      <animate attributeName="r" from="4" to="16" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    <circle
                      cx={pos.x} cy={pos.y}
                      r={4}
                      fill="none"
                      stroke="hsl(var(--gold-bright))"
                      strokeWidth="1.5"
                      opacity="0.6"
                    >
                      <animate attributeName="r" from="4" to="16" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Month hover hitboxes */}
          {riverPoints.map((rp, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={(e) => handleHover(i, e)}
                onMouseLeave={handleLeave}
                className="cursor-pointer"
              >
                {/* Wide invisible hit area */}
                <rect
                  x={rp.x - 25}
                  y={RIVER_CENTER - MAX_RIVER_W - 30}
                  width={50}
                  height={MAX_RIVER_W * 2 + 60}
                  fill="transparent"
                />

                {/* Vertical scan line on hover */}
                {isHovered && (
                  <line
                    x1={rp.x} y1={RIVER_CENTER - rp.w - 15}
                    x2={rp.x} y2={RIVER_CENTER + rp.w + 15}
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1"
                    opacity="0.4"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Top/bottom dots on hover */}
                {isHovered && (
                  <>
                    <circle cx={rp.x} cy={RIVER_CENTER - rp.w - 5} r={3} fill="hsl(var(--primary))" />
                    <circle cx={rp.x} cy={RIVER_CENTER + rp.w + 5} r={3} fill="hsl(var(--primary))" />
                  </>
                )}
              </g>
            );
          })}

          {/* Bottom book counts per year */}
          {yearBookCounts.map(yc => {
            const x = xScale((yc.year - 2021) * 12 + 6);
            return (
              <text
                key={yc.year}
                x={x}
                y={SVG_H - 15}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
                fontFamily="'Source Sans 3', sans-serif"
                opacity="0.5"
              >
                {yc.count} books
              </text>
            );
          })}

          {/* Right-side vibe labels */}
          {(() => {
            const lastRp = riverPoints[riverPoints.length - 1];
            const labelX = lastRp.x + 30;
            return VIBES.map((v, i) => {
              const stack = lastRp.vibeStacks.find(s => s.vibe === v);
              const y = stack
                ? RIVER_CENTER - lastRp.w + stack.yOffset + stack.height / 2
                : RIVER_CENTER - 30 + i * 20;
              return (
                <g key={v}>
                  <line
                    x1={lastRp.x + 5} y1={y}
                    x2={labelX - 5} y2={y}
                    stroke={vibeHSL[v]}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <text
                    x={labelX}
                    y={y + 4}
                    fill={vibeHSL[v]}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="'Source Sans 3', sans-serif"
                  >
                    {vibeLabels[v]}
                  </text>
                </g>
              );
            });
          })()}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && tooltipInfo && (
          <div
            className="absolute z-50 pointer-events-none animate-fade-up"
            style={{
              left: `${tooltipInfo.x}%`,
              top: `${tooltipInfo.y}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <MonthTooltip data={readingData[hoveredIdx]} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 mt-4 justify-center px-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">tributary genesis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-bright" />
          <span className="text-xs text-muted-foreground">5★ pulse on hover</span>
        </div>
        <span className="text-xs text-muted-foreground italic">hover any month to reveal composition</span>
      </div>
    </div>
  );
};

export default RiverOfReading;
