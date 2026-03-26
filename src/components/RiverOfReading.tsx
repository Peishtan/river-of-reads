import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  readingData, MonthData, VibeGroup, vibeLabels, vibeHSL,
  getYears,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];

// Affinity: related genres drift closer, unrelated drift apart
// Higher = closer together. Used to compute dynamic center offsets.
const AFFINITY: Record<VibeGroup, Record<VibeGroup, number>> = {
  escapist: { escapist: 1, ideas: 0.4, nature: 0.2, history: 0.3, memoir: 0.5 },
  ideas:    { escapist: 0.4, ideas: 1, nature: 0.2, history: 0.5, memoir: 0.3 },
  nature:   { escapist: 0.2, ideas: 0.2, nature: 1, history: 0.4, memoir: 0.6 },
  history:  { escapist: 0.3, ideas: 0.5, history: 1, nature: 0.4, memoir: 0.7 },
  memoir:   { escapist: 0.5, ideas: 0.3, nature: 0.6, history: 0.7, memoir: 1 },
};

// Base vertical positions (spread across the height)
const BASE_Y: Record<VibeGroup, number> = {
  escapist: 0.15,
  ideas: 0.35,
  nature: 0.55,
  history: 0.72,
  memoir: 0.88,
};

// Unique sine-wave parameters per river for organic meandering
const MEANDER: Record<VibeGroup, { freq: number; amp: number; phase: number }> = {
  escapist: { freq: 0.08, amp: 18, phase: 0 },
  ideas:    { freq: 0.06, amp: 14, phase: 1.2 },
  nature:   { freq: 0.05, amp: 20, phase: 2.8 },
  history:  { freq: 0.07, amp: 12, phase: 4.1 },
  memoir:   { freq: 0.09, amp: 16, phase: 5.5 },
};

/** Gaussian-weighted moving average */
const smooth = (arr: number[], radius = 3): number[] =>
  arr.map((_, i) => {
    let sum = 0, wt = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(arr.length - 1, i + radius); j++) {
      const w = Math.exp(-2 * ((j - i) / radius) ** 2);
      sum += arr[j] * w;
      wt += w;
    }
    return sum / wt;
  });

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const years = useMemo(() => getYears(), []);

  const series = useMemo(() => {
    const startYear = years[0];
    const endYear = years[years.length - 1];
    const months: {
      monthIdx: number; year: number; month: number;
      data: MonthData | null;
      vibeBooks: Record<VibeGroup, number>;
    }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 0; m < 12; m++) {
        const mi = (y - startYear) * 12 + m;
        const found = readingData.find(d => d.year === y && d.month === m) || null;
        const vb: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, memoir: 0 };
        if (found) found.books.forEach(b => { vb[b.vibe] += 1; });
        months.push({ monthIdx: mi, year: y, month: m, data: found, vibeBooks: vb });
      }
    }
    return months;
  }, [years]);

  // Double-pass smoothed book counts per vibe
  const smoothedCounts = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], memoir: [] };
    series.forEach(s => VIBES.forEach(v => raw[v].push(s.vibeBooks[v])));
    const out: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(v => { out[v] = smooth(smooth(raw[v], 3), 2); });
    return out;
  }, [series]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1400);
    const height = 600;
    const margin = { top: 55, right: 130, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, series.length - 1])
      .range([0, innerW]);

    // Max book count across all vibes for width scaling
    const maxBooks = d3.max(VIBES, v => d3.max(smoothedCounts[v])!) || 1;
    const widthScale = d3.scaleLinear().domain([0, maxBooks]).range([2, 35]);

    const defs = svg.append('defs');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    const dotGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    dotGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const dm2 = dotGlow.append('feMerge');
    dm2.append('feMergeNode').attr('in', 'blur');
    dm2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Per-vibe vertical gradients (transparent at banks, opaque center)
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `vgrad-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.25);
      lg.append('stop').attr('offset', '30%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '70%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '100%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.25);
    });

    // Compute center-line for each vibe at each month index
    // Center = baseY * innerH + meander sine + affinity pull
    const centerLines: Record<VibeGroup, number[]> = {} as any;

    VIBES.forEach(vibe => {
      const base = BASE_Y[vibe] * innerH;
      const { freq, amp, phase } = MEANDER[vibe];
      centerLines[vibe] = series.map((_, i) => {
        // Organic sine meander
        const meander = Math.sin(i * freq + phase) * amp
          + Math.sin(i * freq * 0.6 + phase * 1.3) * amp * 0.4;

        // Affinity pull: when related vibes are active at same time, drift closer
        let pull = 0;
        VIBES.forEach(other => {
          if (other === vibe) return;
          const affinity = AFFINITY[vibe][other];
          const otherVal = smoothedCounts[other][i];
          const myVal = smoothedCounts[vibe][i];
          if (otherVal > 0.5 && myVal > 0.5) {
            const otherBase = BASE_Y[other] * innerH;
            const direction = otherBase > base ? 1 : -1;
            pull += direction * affinity * Math.min(otherVal, myVal) * 3;
          }
        });

        return base + meander + pull;
      });
    });

    // Smooth the center lines too for fluid motion
    VIBES.forEach(vibe => {
      centerLines[vibe] = smooth(smooth(centerLines[vibe], 3), 2) as number[];
    });

    // Floating year labels
    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        g.append('text')
          .attr('x', x(mi)).attr('y', -12)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 5%, 28%)')
          .attr('font-size', '11px')
          .attr('font-weight', '400')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .text(yr);
      }
    });

    // Build per-vibe points: top/bottom edges around center line
    type RiverPoint = { x: number; yTop: number; yBot: number; center: number };
    const riverPaths: Record<VibeGroup, RiverPoint[]> = {} as any;

    VIBES.forEach(vibe => {
      riverPaths[vibe] = series.map((_, i) => {
        const c = centerLines[vibe][i];
        const halfW = widthScale(Math.max(smoothedCounts[vibe][i], 0.15));
        return { x: x(i), yTop: c - halfW, yBot: c + halfW, center: c };
      });
    });

    // Draw each river independently
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];

      // Build area path using curveBasis
      const areaGen = d3.area<RiverPoint>()
        .x(d => d.x)
        .y0(d => d.yBot)
        .y1(d => d.yTop)
        .curve(d3.curveBasis);

      const lineTopGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yTop).curve(d3.curveBasis);
      const lineBotGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yBot).curve(d3.curveBasis);

      // Ambient glow
      g.append('path')
        .datum(pts)
        .attr('d', areaGen)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.06)
        .attr('filter', 'url(#river-glow)');

      // Main fill with vertical gradient
      g.append('path')
        .datum(pts)
        .attr('d', areaGen)
        .attr('fill', `url(#vgrad-${vibe})`);

      // Subtle white edge separators
      [lineTopGen, lineBotGen].forEach(gen => {
        g.append('path')
          .datum(pts)
          .attr('d', gen)
          .attr('fill', 'none')
          .attr('stroke', 'hsla(0, 0%, 100%, 0.06)')
          .attr('stroke-width', 0.8);
      });
    });

    // Right-side vibe labels
    const lastIdx = series.length - 1;
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];
      const lastPt = pts[lastIdx];
      const labelX = innerW + 16;

      g.append('line')
        .attr('x1', innerW + 2).attr('y1', lastPt.center)
        .attr('x2', labelX - 3).attr('y2', lastPt.center)
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 0.4)
        .attr('opacity', 0.25);

      g.append('text')
        .attr('x', labelX).attr('y', lastPt.center + 4)
        .attr('fill', vibeHSL[vibe])
        .attr('font-size', '10px')
        .attr('font-weight', '400')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.6)
        .text(vibeLabels[vibe]);
    });

    // Hover hitboxes
    const hitboxes = g.append('g');
    const colW = innerW / series.length;

    series.forEach((s, i) => {
      const hitbox = hitboxes.append('rect')
        .attr('x', x(i) - colW / 2).attr('y', 0)
        .attr('width', colW).attr('height', innerH)
        .attr('fill', 'transparent').attr('cursor', 'pointer');

      hitbox.on('mouseenter', () => {
        if (s.data) {
          setHoveredMonth(s.data);
          // Position tooltip above the topmost river at this index
          const topmost = d3.min(VIBES, v => riverPaths[v][i].yTop)!;
          setTooltipPos({
            x: ((margin.left + x(i)) / width) * 100,
            y: ((margin.top + topmost - 10) / height) * 100,
          });
        }

        g.selectAll('.hover-el').remove();

        // Show a glowing dot on each active river
        VIBES.forEach(vibe => {
          const val = smoothedCounts[vibe][i];
          if (val < 0.3) return;
          const center = riverPaths[vibe][i].center;

          g.append('circle').attr('class', 'hover-el')
            .attr('cx', x(i)).attr('cy', center).attr('r', 7)
            .attr('fill', 'none')
            .attr('stroke', vibeHSL[vibe])
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.4)
            .attr('filter', 'url(#dot-glow)');

          g.append('circle').attr('class', 'hover-el')
            .attr('cx', x(i)).attr('cy', center).attr('r', 3)
            .attr('fill', vibeHSL[vibe])
            .attr('opacity', 0.85);
        });
      });

      hitbox.on('mouseleave', () => {
        setHoveredMonth(null);
        setTooltipPos(null);
        g.selectAll('.hover-el').remove();
      });
    });

  }, [series, smoothedCounts, years]);

  return (
    <div className="min-h-screen bg-[#0B1215] flex flex-col items-center px-2 py-8 overflow-x-auto">
      <header className="text-center mb-6 max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-1 font-serif">
          River of Reading
        </h1>
        <p className="text-sm text-muted-foreground font-light tracking-wide font-sans">
          Five rivers of taste — 2021 to present · width = books read · hover to explore
        </p>
      </header>

      <div ref={containerRef} className="relative w-full max-w-[1800px]" style={{ minWidth: 1200 }}>
        <svg ref={svgRef} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" />

        {hoveredMonth && tooltipPos && (
          <div
            className="absolute z-50 pointer-events-none animate-fade-up"
            style={{
              left: `${tooltipPos.x}%`,
              top: `${tooltipPos.y}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <MonthTooltip data={hoveredMonth} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-5 mt-4 justify-center px-4">
        {VIBES.map(v => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: vibeHSL[v], opacity: 0.7 }} />
            <span className="text-xs text-muted-foreground">{vibeLabels[v]}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground italic border-l border-border pl-4">hover any month to explore</span>
      </div>
    </div>
  );
};

export default RiverOfReading;
