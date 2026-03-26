import { useState, useMemo, useCallback, useRef } from 'react';
import {
  readingData, VibeGroup, vibeLabels, vibeHSL,
  totalPages, avgRating, monthLabelFull,
  getYears, toMonthIndex,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history'];

const SVG_W = 1400;
const SVG_H = 560;
const PAD_L = 60;
const PAD_R = 150;
const PAD_T = 70;
const PAD_B = 50;

// Each vibe gets its own horizontal band
const STREAM_AREA_TOP = PAD_T + 10;
const STREAM_AREA_BOT = SVG_H - PAD_B - 10;
const STREAM_GAP = 12; // gap between streams
const NUM_STREAMS = VIBES.length;
const STREAM_BAND_H = (STREAM_AREA_BOT - STREAM_AREA_TOP - STREAM_GAP * (NUM_STREAMS - 1)) / NUM_STREAMS;
const MAX_STREAM_HALF = STREAM_BAND_H / 2 - 4; // max half-thickness of a single stream

const RiverOfReading = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const years = useMemo(() => getYears(), []);
  const totalMonths = useMemo(() => (years[years.length - 1] - years[0]) * 12 + 3, [years]);

  const xScale = useCallback((monthIdx: number) => {
    return PAD_L + (monthIdx / totalMonths) * (SVG_W - PAD_L - PAD_R);
  }, [totalMonths]);

  // Center Y for each vibe's lane
  const vibeCenterY = (vibeIdx: number) =>
    STREAM_AREA_TOP + STREAM_BAND_H / 2 + vibeIdx * (STREAM_BAND_H + STREAM_GAP);

  // Max pages per vibe across all months (for scaling each stream independently)
  const maxVibePages = useMemo(() => {
    const maxes: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0 };
    readingData.forEach(d => {
      const vp: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0 };
      d.books.forEach(b => { vp[b.vibe] += b.pages; });
      VIBES.forEach(v => { maxes[v] = Math.max(maxes[v], vp[v]); });
    });
    return maxes;
  }, []);

  // Build per-vibe stream data at each data point
  const streamData = useMemo(() => {
    return VIBES.map((vibe, vi) => {
      const centerY = vibeCenterY(vi);
      const maxP = maxVibePages[vibe] || 1;

      const points = readingData.map(d => {
        const mi = toMonthIndex(d);
        const x = xScale(mi);
        const vibeP = d.books.filter(b => b.vibe === vibe).reduce((a, b) => a + b.pages, 0);
        const halfW = vibeP > 0 ? Math.max(3, (vibeP / maxP) * MAX_STREAM_HALF) : 0;
        const fiveStars = d.books.filter(b => b.vibe === vibe && b.rating === 5);

        return { x, centerY, halfW, vibeP, fiveStars, monthData: d };
      });

      return { vibe, vibeIdx: vi, centerY, points };
    });
  }, [xScale, maxVibePages]);

  // Catmull-Rom
  const catmullPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  // Build filled area path for each stream
  const streamPaths = useMemo(() => {
    return streamData.map(sd => {
      // For points with 0 pages, collapse to a thin line (halfW=1)
      const topPts = sd.points.map(p => ({
        x: p.x,
        y: p.centerY - (p.halfW > 0 ? p.halfW : 1),
      }));
      const botPts = sd.points.map(p => ({
        x: p.x,
        y: p.centerY + (p.halfW > 0 ? p.halfW : 1),
      }));

      const topD = catmullPath(topPts);
      const botRev = [...botPts].reverse();
      const botD = catmullPath(botRev);
      const last = topPts[topPts.length - 1];
      const firstRev = botRev[0];
      const path = `${topD} L${last.x.toFixed(1)},${last.y.toFixed(1)} L${firstRev.x.toFixed(1)},${firstRev.y.toFixed(1)} ${botD.replace(/^M[^ ]+/, '')} Z`;

      // Center line
      const centerLine = catmullPath(sd.points.map(p => ({ x: p.x, y: p.centerY })));

      return { vibe: sd.vibe, vibeIdx: sd.vibeIdx, path, centerLine, centerY: sd.centerY };
    });
  }, [streamData]);

  // 5-star positions
  const fiveStarPositions = useMemo(() => {
    const positions: { x: number; y: number; rpIdx: number }[] = [];
    streamData.forEach(sd => {
      sd.points.forEach((p, pi) => {
        p.fiveStars.forEach((book, bi) => {
          const yOff = p.fiveStars.length > 1
            ? (bi / (p.fiveStars.length - 1) - 0.5) * p.halfW * 1.2
            : 0;
          positions.push({
            x: p.x,
            y: p.centerY + yOff,
            rpIdx: pi,
          });
        });
      });
    });
    return positions;
  }, [streamData]);

  // Annotations
  const annotations = useMemo(() => {
    const annots: { x: number; y: number; text: string }[] = [];
    streamData.forEach(sd => {
      sd.points.forEach((p, pi) => {
        p.monthData.books
          .filter(b => b.vibe === sd.vibe && b.annotation)
          .forEach((book, bi) => {
            const side = pi % 2 === 0 ? -1 : 1;
            annots.push({
              x: p.x,
              y: p.centerY + side * (p.halfW + 12 + bi * 12),
              text: book.annotation!,
            });
          });
      });
    });
    return annots;
  }, [streamData]);

  // Year positions
  const yearPositions = useMemo(() => years.map(y => ({
    year: y,
    x: xScale((y - 2021) * 12),
  })), [years, xScale]);

  // Year book counts
  const yearBookCounts = useMemo(() => years.map(y => ({
    year: y,
    count: readingData.filter(d => d.year === y).reduce((a, d) => a + d.books.length, 0),
  })), [years]);

  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number } | null>(null);

  const handleHover = (idx: number) => {
    setHoveredIdx(idx);
    // Find topmost stream point for this data index to position tooltip above
    const x = streamData[0].points[idx].x;
    const topY = STREAM_AREA_TOP - 10;
    setTooltipInfo({ x: (x / SVG_W) * 100, y: (topY / SVG_H) * 100 });
  };

  const handleLeave = () => {
    setHoveredIdx(null);
    setTooltipInfo(null);
  };

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
            <filter id="stream-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Year markers */}
          {yearPositions.map(yp => (
            <g key={yp.year}>
              <line
                x1={yp.x} y1={PAD_T - 10}
                x2={yp.x} y2={SVG_H - PAD_B + 10}
                stroke="hsl(200, 10%, 20%)"
                strokeWidth="0.5"
                strokeDasharray="4 6"
              />
              <text
                x={yp.x} y={PAD_T - 22}
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

          {/* Stream bands — each vibe is its own ribbon */}
          {streamPaths.map(sp => (
            <g key={sp.vibe}>
              {/* Filled stream area */}
              <path
                d={sp.path}
                fill={vibeHSL[sp.vibe]}
                opacity={0.55}
                filter="url(#stream-glow)"
              />
              {/* Brighter center stroke */}
              <path
                d={sp.centerLine}
                fill="none"
                stroke={vibeHSL[sp.vibe]}
                strokeWidth="1.5"
                opacity="0.7"
              />
              {/* Edge highlights */}
              {(() => {
                const sd = streamData[sp.vibeIdx];
                const topPts = sd.points.map(p => ({ x: p.x, y: p.centerY - Math.max(p.halfW, 1) }));
                const botPts = sd.points.map(p => ({ x: p.x, y: p.centerY + Math.max(p.halfW, 1) }));
                return (
                  <>
                    <path d={catmullPath(topPts)} fill="none" stroke={vibeHSL[sp.vibe]} strokeWidth="0.8" opacity="0.4" />
                    <path d={catmullPath(botPts)} fill="none" stroke={vibeHSL[sp.vibe]} strokeWidth="0.8" opacity="0.4" />
                  </>
                );
              })()}
            </g>
          ))}

          {/* Annotations */}
          {annotations.map((a, i) => (
            <text
              key={i}
              x={a.x}
              y={a.y}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="9"
              fontStyle="italic"
              fontFamily="'Source Sans 3', sans-serif"
              opacity="0.6"
            >
              {a.text.split('\n').map((line, li) => (
                <tspan key={li} x={a.x} dy={li === 0 ? 0 : 11}>{line}</tspan>
              ))}
            </text>
          ))}

          {/* 5-star gold pulse rings */}
          {fiveStarPositions.map((pos, i) => {
            const isActive = hoveredIdx === pos.rpIdx;
            return (
              <g key={`star-${i}`}>
                <circle
                  cx={pos.x} cy={pos.y}
                  r={3}
                  fill="hsl(var(--gold-bright))"
                  opacity={isActive ? 1 : 0.5}
                  className="transition-opacity duration-200"
                />
                {isActive && (
                  <>
                    <circle cx={pos.x} cy={pos.y} r={4} fill="none"
                      stroke="hsl(var(--gold-bright))" strokeWidth="2" opacity="0.8">
                      <animate attributeName="r" from="4" to="16" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={pos.x} cy={pos.y} r={4} fill="none"
                      stroke="hsl(var(--gold-bright))" strokeWidth="1.5" opacity="0.6">
                      <animate attributeName="r" from="4" to="16" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          {/* Hover hitboxes — vertical columns spanning all streams */}
          {readingData.map((_, i) => {
            const x = streamData[0].points[i].x;
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => handleHover(i)}
                onMouseLeave={handleLeave}
                className="cursor-pointer"
              >
                <rect
                  x={x - 25} y={STREAM_AREA_TOP - 10}
                  width={50} height={STREAM_AREA_BOT - STREAM_AREA_TOP + 20}
                  fill="transparent"
                />
                {isHovered && (
                  <line
                    x1={x} y1={STREAM_AREA_TOP - 5}
                    x2={x} y2={STREAM_AREA_BOT + 5}
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1"
                    opacity="0.25"
                    strokeDasharray="3 3"
                  />
                )}
                {/* Per-stream dots on hover */}
                {isHovered && streamData.map(sd => {
                  const pt = sd.points[i];
                  if (pt.halfW < 2) return null;
                  return (
                    <circle
                      key={sd.vibe}
                      cx={x} cy={pt.centerY}
                      r={3}
                      fill={vibeHSL[sd.vibe]}
                      stroke="hsl(var(--foreground))"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Bottom book counts per year */}
          {yearBookCounts.map(yc => (
            <text
              key={yc.year}
              x={xScale((yc.year - 2021) * 12 + 6)}
              y={SVG_H - 12}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="11"
              fontFamily="'Source Sans 3', sans-serif"
              opacity="0.4"
            >
              {yc.count} books
            </text>
          ))}

          {/* Right-side vibe labels */}
          {streamPaths.map((sp, i) => {
            const lastPt = streamData[i].points[streamData[i].points.length - 1];
            const labelX = lastPt.x + 25;
            return (
              <g key={sp.vibe}>
                <line
                  x1={lastPt.x + 3} y1={sp.centerY}
                  x2={labelX - 4} y2={sp.centerY}
                  stroke={vibeHSL[sp.vibe]} strokeWidth="1" opacity="0.5"
                />
                <text
                  x={labelX} y={sp.centerY + 4}
                  fill={vibeHSL[sp.vibe]}
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="'Source Sans 3', sans-serif"
                >
                  {vibeLabels[sp.vibe]}
                </text>
              </g>
            );
          })}
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
        {VIBES.map(v => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: vibeHSL[v] }} />
            <span className="text-xs text-muted-foreground">{vibeLabels[v]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-bright" />
          <span className="text-xs text-muted-foreground">5★ pulse on hover</span>
        </div>
        <span className="text-xs text-muted-foreground italic">hover any month to reveal composition</span>
      </div>
    </div>
  );
};

export default RiverOfReading;
