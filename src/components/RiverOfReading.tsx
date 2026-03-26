import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  readingData, MonthData, VibeGroup, vibeLabels, vibeHSL,
  getYears,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];
// Tributaries — everything except the "main current" which is all combined
const TRIBUTARIES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];

// Each tributary gets a signed "drift direction" — how far it wants to push
// away from center when active. Positive = down, negative = up.
const DRIFT_DIR: Record<VibeGroup, number> = {
  escapist: -1,    // drifts up
  ideas: -0.55,    // drifts slightly up
  nature: 0.7,     // drifts down
  history: 0.4,    // drifts slightly down
  memoir: 1,       // drifts down furthest
};

// Unique meander params per tributary
const MEANDER: Record<VibeGroup, { f1: number; f2: number; a1: number; a2: number; p: number }> = {
  escapist: { f1: 0.065, f2: 0.11, a1: 1, a2: 0.4, p: 0 },
  ideas:    { f1: 0.05,  f2: 0.09, a1: 0.8, a2: 0.35, p: 1.4 },
  nature:   { f1: 0.045, f2: 0.08, a1: 0.9, a2: 0.5, p: 2.9 },
  history:  { f1: 0.055, f2: 0.10, a1: 0.7, a2: 0.3, p: 4.2 },
  memoir:   { f1: 0.07,  f2: 0.12, a1: 0.85, a2: 0.45, p: 5.6 },
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
        const found = readingData.find(d => d.year === y && d.month === m) || null;
        const vb: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, memoir: 0 };
        if (found) found.books.forEach(b => { vb[b.vibe] += 1; });
        months.push({ monthIdx: (y - startYear) * 12 + m, year: y, month: m, data: found, vibeBooks: vb });
      }
    }
    return months;
  }, [years]);

  // Double-pass smoothed counts
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
    const centerY = innerH / 2;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, series.length - 1]).range([0, innerW]);

    // Max books in any single vibe for width scaling
    const maxBooks = d3.max(VIBES, v => d3.max(smoothedCounts[v])!) || 1;
    const widthScale = d3.scaleLinear().domain([0, maxBooks]).range([1.5, 30]);

    // Max drift distance from center
    const maxDrift = innerH * 0.38;

    const defs = svg.append('defs');

    // Glow filters
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    const dotGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    dotGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const dm = dotGlow.append('feMerge');
    dm.append('feMergeNode').attr('in', 'blur');
    dm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Per-vibe vertical gradients
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `vgrad-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.2);
      lg.append('stop').attr('offset', '30%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '70%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '100%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.2);
    });

    // Compute braided center lines:
    // - All start at centerY (the spine)
    // - Drift AWAY proportional to their book count (volume pushes outward)
    // - Get PULLED BACK toward center when volume is low (radial attractor)
    // - Meander with unique sine harmonics
    type RiverPoint = { x: number; yTop: number; yBot: number; center: number };
    const riverPaths: Record<VibeGroup, RiverPoint[]> = {} as any;

    VIBES.forEach(vibe => {
      const counts = smoothedCounts[vibe];
      const { f1, f2, a1, a2, p } = MEANDER[vibe];
      const dir = DRIFT_DIR[vibe];

      // Raw center positions
      const rawCenters = series.map((_, i) => {
        const t = i / (series.length - 1); // 0..1 progress through time

        // Volume-driven push: higher count = pushed further from center
        const volume = counts[i];
        const pushStrength = volume / maxBooks; // 0..1

        // Attractor: low volume pulls back to center, high volume lets it drift
        // At t=0 everything starts at center (confluence origin)
        const originPull = Math.max(0, 1 - t * 4); // strong pull in first ~25% of timeline
        const volumePull = 1 - pushStrength; // pulled back when volume is low

        const attractorStrength = Math.max(originPull, volumePull * 0.7);
        const driftAmount = maxDrift * pushStrength * (1 - attractorStrength);

        // Organic meander (sine harmonics)
        const meander = (Math.sin(i * f1 + p) * a1 + Math.sin(i * f2 + p * 1.3) * a2) * 12;

        const offset = dir * driftAmount + meander;
        return centerY + offset;
      });

      // Double-smooth the center line itself
      const smoothCenters = smooth(smooth(rawCenters, 3), 2);

      riverPaths[vibe] = series.map((_, i) => {
        const c = smoothCenters[i];
        const halfW = widthScale(Math.max(counts[i], 0.12));
        return { x: x(i), yTop: c - halfW, yBot: c + halfW, center: c };
      });
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

    // Draw connecting membranes FIRST (behind rivers)
    // Thin translucent "water" between each tributary and the center spine
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];
      // Membrane: area from the tributary's inner edge to the center
      const membraneArea = d3.area<RiverPoint>()
        .x(d => d.x)
        .y0(() => centerY)
        .y1(d => DRIFT_DIR[vibe] < 0 ? d.yBot : d.yTop) // inner edge toward center
        .curve(d3.curveBasis);

      g.append('path')
        .datum(pts)
        .attr('d', membraneArea)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.04);
    });

    // Draw each river
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];

      const areaGen = d3.area<RiverPoint>()
        .x(d => d.x).y0(d => d.yBot).y1(d => d.yTop)
        .curve(d3.curveBasis);

      const lineTopGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yTop).curve(d3.curveBasis);
      const lineBotGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yBot).curve(d3.curveBasis);

      // Ambient glow
      g.append('path').datum(pts).attr('d', areaGen)
        .attr('fill', vibeHSL[vibe]).attr('opacity', 0.06)
        .attr('filter', 'url(#river-glow)');

      // Main fill
      g.append('path').datum(pts).attr('d', areaGen)
        .attr('fill', `url(#vgrad-${vibe})`);

      // Subtle white edge
      [lineTopGen, lineBotGen].forEach(gen => {
        g.append('path').datum(pts).attr('d', gen)
          .attr('fill', 'none')
          .attr('stroke', 'hsla(0, 0%, 100%, 0.06)')
          .attr('stroke-width', 0.8);
      });
    });

    // Central spine indicator — very subtle
    g.append('line')
      .attr('x1', 0).attr('y1', centerY)
      .attr('x2', innerW).attr('y2', centerY)
      .attr('stroke', 'hsla(180, 20%, 40%, 0.06)')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2 12');

    // Right-side vibe labels
    const lastIdx = series.length - 1;
    VIBES.forEach(vibe => {
      const lastPt = riverPaths[vibe][lastIdx];
      const labelX = innerW + 16;

      g.append('line')
        .attr('x1', innerW + 2).attr('y1', lastPt.center)
        .attr('x2', labelX - 3).attr('y2', lastPt.center)
        .attr('stroke', vibeHSL[vibe]).attr('stroke-width', 0.4).attr('opacity', 0.25);

      g.append('text')
        .attr('x', labelX).attr('y', lastPt.center + 4)
        .attr('fill', vibeHSL[vibe])
        .attr('font-size', '10px').attr('font-weight', '400')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.6)
        .text(vibeLabels[vibe]);
    });

    // Hover
    const hitboxes = g.append('g');
    const colW = innerW / series.length;

    series.forEach((s, i) => {
      hitboxes.append('rect')
        .attr('x', x(i) - colW / 2).attr('y', 0)
        .attr('width', colW).attr('height', innerH)
        .attr('fill', 'transparent').attr('cursor', 'pointer')
        .on('mouseenter', () => {
          if (s.data) {
            setHoveredMonth(s.data);
            const topmost = d3.min(VIBES, v => riverPaths[v][i].yTop)!;
            setTooltipPos({
              x: ((margin.left + x(i)) / width) * 100,
              y: ((margin.top + topmost - 10) / height) * 100,
            });
          }

          g.selectAll('.hover-el').remove();

          // Glowing dots on each active tributary
          VIBES.forEach(vibe => {
            if (smoothedCounts[vibe][i] < 0.3) return;
            const c = riverPaths[vibe][i].center;

            g.append('circle').attr('class', 'hover-el')
              .attr('cx', x(i)).attr('cy', c).attr('r', 7)
              .attr('fill', 'none')
              .attr('stroke', vibeHSL[vibe])
              .attr('stroke-width', 1.5).attr('opacity', 0.4)
              .attr('filter', 'url(#dot-glow)');

            g.append('circle').attr('class', 'hover-el')
              .attr('cx', x(i)).attr('cy', c).attr('r', 3)
              .attr('fill', vibeHSL[vibe]).attr('opacity', 0.85);
          });

          // Connecting lines from each dot to the spine
          VIBES.forEach(vibe => {
            if (smoothedCounts[vibe][i] < 0.3) return;
            const c = riverPaths[vibe][i].center;
            g.append('line').attr('class', 'hover-el')
              .attr('x1', x(i)).attr('y1', centerY)
              .attr('x2', x(i)).attr('y2', c)
              .attr('stroke', vibeHSL[vibe])
              .attr('stroke-width', 0.5).attr('opacity', 0.15)
              .attr('stroke-dasharray', '2 4');
          });
        })
        .on('mouseleave', () => {
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
          A braided river of taste — 2021 to present · tributaries branch when genres surge · hover to explore
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
