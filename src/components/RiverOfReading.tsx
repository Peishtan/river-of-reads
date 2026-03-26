import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MonthData, VibeGroup, vibeLabels, VIBES,
} from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';
import MonthTooltip from './MonthTooltip';
import RiverSettings from './RiverSettings';
import DeltaInsights from './DeltaInsights';

/* ── helpers ─────────────────────────────────────────────── */

const seededNoise = (seed: number, i: number): number => (
  Math.sin(i * 0.137 + seed * 7.31) * 0.4 +
  Math.sin(i * 0.071 + seed * 13.7) * 0.3 +
  Math.sin(i * 0.213 + seed * 3.19) * 0.2 +
  Math.sin(i * 0.043 + seed * 19.1) * 0.1
);

const MEANDER_CFG: Record<VibeGroup, { f1: number; f2: number; a1: number; a2: number; p: number }> = {
  escapist: { f1: 0.065, f2: 0.11, a1: 1, a2: 0.4, p: 0 },
  ideas:    { f1: 0.05,  f2: 0.09, a1: 0.8, a2: 0.35, p: 1.4 },
  nature:   { f1: 0.045, f2: 0.08, a1: 0.9, a2: 0.5, p: 2.9 },
  history:  { f1: 0.055, f2: 0.10, a1: 0.7, a2: 0.3, p: 4.2 },
  life:     { f1: 0.07,  f2: 0.12, a1: 0.85, a2: 0.45, p: 5.6 },
};

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

function saturateHSL(hsl: string, extraS = 15, extraL = 0): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hsl;
  return `hsl(${m[1]}, ${Math.min(100, parseInt(m[2]) + extraS)}%, ${Math.min(100, parseInt(m[3]) + extraL)}%)`;
}

function brightenHSL(hsl: string): string {
  return saturateHSL(hsl, 10, 13);
}

function parseHSL(hsl: string): [number, number, number] | null {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

/* ── component ───────────────────────────────────────────── */

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: readingData, riverColors, session, signOut } = useReadingData();

  /* ── derived data ──────────────────────────────────────── */

  const years = useMemo(() => {
    const yrs = [...new Set(readingData.map(d => d.year))].sort();
    return yrs.length ? yrs : [2021];
  }, [readingData]);

  const series = useMemo(() => {
    const startYear = years[0], endYear = years[years.length - 1];
    const months: {
      monthIdx: number; year: number; month: number;
      data: MonthData | null;
      vibeBooks: Record<VibeGroup, number>;
      vibeRatingSum: Record<VibeGroup, number>;
    }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 0; m < 12; m++) {
        const found = readingData.find(d => d.year === y && d.month === m) || null;
        const vb: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0 };
        const vr: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0 };
        if (found) {
          found.books.forEach(b => b.vibes.forEach(v => { vb[v]++; vr[v] += b.rating; }));
        }
        months.push({ monthIdx: (y - startYear) * 12 + m, year: y, month: m, data: found, vibeBooks: vb, vibeRatingSum: vr });
      }
    }
    return months;
  }, [years, readingData]);

  // Smoothed counts with carry-forward so rivers never fully vanish
  const smoothedCounts = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [] };
    series.forEach(s => VIBES.forEach(v => raw[v].push(s.vibeBooks[v])));
    const out: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(v => {
      const s = smooth(smooth(raw[v], 3), 2);
      let lastSig = 0;
      for (let i = s.length - 1; i >= 0; i--) { if (s[i] > 0.5) { lastSig = i; break; } }
      const peak = d3.max(s)!;
      const hold = peak * 0.35;
      for (let i = lastSig + 1; i < s.length; i++) {
        const fade = (i - lastSig) / 12;
        s[i] = Math.max(s[i], hold * Math.max(0.3, 1 - fade * 0.5));
      }
      out[v] = s;
    });
    return out;
  }, [series]);

  // Average rating per vibe per month
  const avgVibeRating = useMemo(() => {
    const out: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [] };
    series.forEach(s => VIBES.forEach(v => {
      const c = s.vibeBooks[v];
      out[v].push(c > 0 ? s.vibeRatingSum[v] / c : 3);
    }));
    VIBES.forEach(v => { out[v] = smooth(out[v], 2); });
    return out;
  }, [series]);

  /* ── D3 rendering ──────────────────────────────────────── */

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const currentColors: Record<VibeGroup, string> = {} as any;
    const currentBright: Record<VibeGroup, string> = {} as any;
    const currentSaturated: Record<VibeGroup, string> = {} as any;
    VIBES.forEach(v => {
      currentColors[v] = saturateHSL(riverColors[v], 12, 0);   // bump saturation
      currentBright[v] = brightenHSL(currentColors[v]);
      currentSaturated[v] = saturateHSL(riverColors[v], 25, 5); // extra punch
    });

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1400);
    const height = Math.max(Math.round(window.innerHeight * 0.7), 500);
    const margin = { top: 55, right: 130, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, series.length - 1]).range([0, innerW]);
    const defs = svg.append('defs');

    /* ── SVG filters ─────────────────────────────────────── */

    // Outer glow per vibe (faint drop-shadow so paths pop off black bg)
    VIBES.forEach(vibe => {
      const hsl = parseHSL(currentSaturated[vibe]);
      const f = defs.append('filter').attr('id', `outer-glow-${vibe}`)
        .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
      f.append('feGaussianBlur').attr('stdDeviation', '6').attr('in', 'SourceGraphic').attr('result', 'blur');
      if (hsl) {
        f.append('feFlood')
          .attr('flood-color', `hsl(${hsl[0]}, ${Math.min(100, hsl[1] + 20)}%, ${Math.min(90, hsl[2] + 10)}%)`)
          .attr('flood-opacity', '0.35').attr('result', 'color');
        f.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
      }
      const merge = f.append('feMerge');
      merge.append('feMergeNode').attr('in', hsl ? 'glow' : 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // Loved-glow for high-rated segments
    VIBES.forEach(vibe => {
      const hsl = parseHSL(currentSaturated[vibe]);
      const f = defs.append('filter').attr('id', `loved-glow-${vibe}`)
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      f.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
      if (hsl) {
        f.append('feFlood')
          .attr('flood-color', `hsl(${hsl[0]}, ${Math.min(100, hsl[1] + 30)}%, ${Math.min(95, hsl[2] + 18)}%)`)
          .attr('flood-opacity', '0.5').attr('result', 'color');
        f.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
      }
      const merge = f.append('feMerge');
      merge.append('feMergeNode').attr('in', hsl ? 'glow' : 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    const dotGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    dotGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const dm = dotGlow.append('feMerge');
    dm.append('feMergeNode').attr('in', 'blur');
    dm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Right-edge feathered fade
    const fadeStart = Math.max(0, (innerW - 60) / innerW);
    const fadeGrad = defs.append('linearGradient').attr('id', 'fade-right')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    fadeGrad.append('stop').attr('offset', '0%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeGrad.append('stop').attr('offset', `${fadeStart * 100}%`).attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeGrad.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);
    const fadeMask = defs.append('mask').attr('id', 'river-fade');
    fadeMask.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'url(#fade-right)');

    // Cylindrical gradients per vibe
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient').attr('id', `cyl-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.2);
      lg.append('stop').attr('offset', '25%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.6);
      lg.append('stop').attr('offset', '45%').attr('stop-color', currentBright[vibe]).attr('stop-opacity', 0.9);
      lg.append('stop').attr('offset', '55%').attr('stop-color', currentBright[vibe]).attr('stop-opacity', 0.9);
      lg.append('stop').attr('offset', '75%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.6);
      lg.append('stop').attr('offset', '100%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.2);
    });

    /* ── D3 stack with wiggle + insideOut ─────────────────── */

    // Power-scale the counts so thin months still feel substantial
    const powerScale = d3.scalePow().exponent(0.6).domain([0, d3.max(VIBES, v => d3.max(smoothedCounts[v])!)!]).range([0.15, 1]);

    // Build stack data: array of { idx, escapist, ideas, ... }
    const stackData = series.map((_, i) => {
      const row: Record<string, number> = { idx: i };
      VIBES.forEach(v => { row[v] = powerScale(smoothedCounts[v][i]); });
      return row;
    });

    const stack = d3.stack<Record<string, number>>()
      .keys(VIBES as string[])
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);

    const stackedLayers = stack(stackData);

    // Scale Y to fill the full container height
    const yExtent = [
      d3.min(stackedLayers, layer => d3.min(layer, d => d[0]))!,
      d3.max(stackedLayers, layer => d3.max(layer, d => d[1]))!,
    ];
    const yScale = d3.scaleLinear().domain(yExtent).range([innerH * 0.05, innerH * 0.95]);

    // Compute per-vibe meander offsets (organic drift applied to the stack baseline)
    const meanderOffsets: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(vibe => {
      const { f1, f2, a1, a2, p } = MEANDER_CFG[vibe];
      meanderOffsets[vibe] = series.map((_, i) => {
        const t = i / (series.length - 1);
        const rampUp = 1 - Math.exp(-t * 4); // start tight, diverge
        const meander = (Math.sin(i * f1 + p) * a1 + Math.sin(i * f2 + p * 1.3) * a2) * 8;
        const noise = seededNoise(VIBES.indexOf(vibe) + 1, i) * 5;
        return (meander + noise) * rampUp;
      });
    });

    /* ── Year labels ─────────────────────────────────────── */

    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        g.append('text')
          .attr('x', xScale(mi)).attr('y', -20)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 8%, 38%)')
          .attr('font-size', '13px').attr('font-weight', '600')
          .attr('font-family', "'Playfair Display', 'Georgia', serif")
          .attr('letter-spacing', '0.08em')
          .text(yr);

        // Tide line
        g.append('line')
          .attr('x1', xScale(mi)).attr('y1', -8)
          .attr('x2', xScale(mi)).attr('y2', innerH)
          .attr('stroke', 'hsl(200, 8%, 38%)')
          .attr('stroke-width', 0.5).attr('opacity', 0.05);
      }
    });

    /* ── Draw rivers ─────────────────────────────────────── */

    const riverGroup = g.append('g').attr('mask', 'url(#river-fade)');

    // Store computed paths for hover lookups
    type LayerPoint = { x: number; y0: number; y1: number; center: number };
    const layerPaths: Record<VibeGroup, LayerPoint[]> = {} as any;

    stackedLayers.forEach(layer => {
      const vibe = layer.key as VibeGroup;
      const meanderOff = meanderOffsets[vibe];
      const ratings = avgVibeRating[vibe];

      // Compute points with meander applied
      const pts: LayerPoint[] = layer.map((d, i) => {
        const mx = meanderOff[i];
        const y0 = yScale(d[0]) + mx;
        const y1 = yScale(d[1]) + mx;
        return { x: xScale(i), y0, y1, center: (y0 + y1) / 2 };
      });
      layerPaths[vibe] = pts;

      // ── Glow shadow layer (behind)
      const glowArea = d3.area<LayerPoint>()
        .x(d => d.x).y0(d => d.y0).y1(d => d.y1)
        .curve(d3.curveBasis);

      riverGroup.append('path').datum(pts).attr('d', glowArea)
        .attr('fill', currentSaturated[vibe]).attr('opacity', 0.08)
        .attr('filter', `url(#outer-glow-${vibe})`);

      // ── Main fill: segmented for rating-based opacity + loved glow
      const segSize = 4;
      for (let si = 0; si < pts.length - 1; si += segSize) {
        const end = Math.min(si + segSize + 1, pts.length);
        const seg = pts.slice(si, end);
        const avgRat = seg.reduce((a, _, j) => a + (ratings[si + j] || 3), 0) / seg.length;
        const ratingNorm = Math.max(0.35, (avgRat - 1) / 4);

        const segArea = d3.area<LayerPoint>()
          .x(d => d.x).y0(d => d.y0).y1(d => d.y1)
          .curve(d3.curveBasis);

        const path = riverGroup.append('path').datum(seg).attr('d', segArea)
          .attr('fill', `url(#cyl-${vibe})`)
          .attr('opacity', 0.3 + ratingNorm * 0.55);

        if (avgRat > 4.2) {
          path.attr('filter', `url(#loved-glow-${vibe})`);
        }
      }

      // ── Bright center highlight stroke
      const centerLine = d3.line<LayerPoint>()
        .x(d => d.x).y(d => d.center)
        .curve(d3.curveBasis);

      riverGroup.append('path').datum(pts).attr('d', centerLine)
        .attr('fill', 'none')
        .attr('stroke', currentBright[vibe])
        .attr('stroke-width', 1)
        .attr('opacity', 0.15);

      // ── Top edge highlight
      const topLine = d3.line<LayerPoint>().x(d => d.x).y(d => d.y1).curve(d3.curveBasis);
      riverGroup.append('path').datum(pts).attr('d', topLine)
        .attr('fill', 'none')
        .attr('stroke', 'hsla(0, 0%, 100%, 0.06)')
        .attr('stroke-width', 0.5);
    });

    /* ── Right-side labels ───────────────────────────────── */

    const lastIdx = series.length - 1;
    VIBES.forEach(vibe => {
      const lastPt = layerPaths[vibe][lastIdx];
      const labelX = innerW + 16;

      g.append('line')
        .attr('x1', innerW + 2).attr('y1', lastPt.center)
        .attr('x2', labelX - 3).attr('y2', lastPt.center)
        .attr('stroke', currentColors[vibe]).attr('stroke-width', 0.4).attr('opacity', 0.3);

      g.append('text')
        .attr('x', labelX).attr('y', lastPt.center + 4)
        .attr('fill', currentColors[vibe])
        .attr('font-size', '10px').attr('font-weight', '400')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.7)
        .text(vibeLabels[vibe]);
    });

    /* ── Hover interaction ───────────────────────────────── */

    const findNearestData = (idx: number): { data: MonthData; idx: number } | null => {
      if (series[idx]?.data) return { data: series[idx].data!, idx };
      for (let d = 1; d <= 3; d++) {
        if (idx - d >= 0 && series[idx - d]?.data) return { data: series[idx - d].data!, idx: idx - d };
        if (idx + d < series.length && series[idx + d]?.data) return { data: series[idx + d].data!, idx: idx + d };
      }
      return null;
    };

    const showHover = (i: number, event?: MouseEvent) => {
      const nearest = findNearestData(i);
      if (nearest) setHoveredMonth(nearest.data);

      if (event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }

      g.selectAll('.hover-el').remove();

      VIBES.forEach(vibe => {
        if (smoothedCounts[vibe][i] < 0.3) return;
        const c = layerPaths[vibe][i].center;

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', xScale(i)).attr('cy', c).attr('r', 7)
          .attr('fill', 'none').attr('stroke', currentBright[vibe])
          .attr('stroke-width', 1.5).attr('opacity', 0.5)
          .attr('filter', 'url(#dot-glow)');

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', xScale(i)).attr('cy', c).attr('r', 3)
          .attr('fill', currentBright[vibe]).attr('opacity', 0.9);
      });
    };

    const hideHover = () => {
      setHoveredMonth(null);
      setMousePos(null);
      g.selectAll('.hover-el').remove();
    };

    // Hitboxes
    const hitboxes = g.append('g');
    const colW = innerW / series.length;
    series.forEach((_, i) => {
      hitboxes.append('rect')
        .attr('x', xScale(i) - colW / 2).attr('y', 0)
        .attr('width', colW).attr('height', innerH)
        .attr('fill', 'transparent').attr('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => showHover(i, event))
        .on('mousemove', (event: MouseEvent) => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseleave', hideHover)
        .on('click', (event: MouseEvent) => showHover(i, event));
    });

  }, [series, smoothedCounts, avgVibeRating, years, riverColors]);

  // Dismiss on tap outside
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setHoveredMonth(null);
        setMousePos(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  /* ── JSX ───────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-2 py-8">
      <header className="text-center mb-6 max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-1 font-serif">
          River of Reading
        </h1>
        <p className="text-sm text-muted-foreground font-light tracking-wide font-sans">
          A braided river of taste — tributaries branch when genres surge · hover to explore
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {session && (
            <a href="/upload" className="text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4">
              Import your data →
            </a>
          )}
          {session && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4"
            >
              ⚙ River Settings
            </button>
          )}
          {session ? (
            <button
              onClick={signOut}
              className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors underline underline-offset-4"
            >
              Sign out
            </button>
          ) : (
            <a href="/auth" className="text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4">
              Sign in →
            </a>
          )}
        </div>
        {!session && (
          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">Viewing demo data</p>
        )}
      </header>

      <div className="w-full max-w-[1800px] overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div ref={containerRef} className="relative" style={{ minWidth: 1200 }}>
          <svg ref={svgRef} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" />

          {hoveredMonth && mousePos && (
            <div
              className="absolute z-50 pointer-events-none animate-fade-up"
              style={{
                left: `${mousePos.x}px`,
                top: `${mousePos.y}px`,
                transform: 'translate(16px, -100%)',
              }}
            >
              <MonthTooltip data={hoveredMonth} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 mt-4 justify-center px-4">
        {VIBES.map(v => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riverColors[v], opacity: 0.85 }} />
            <span className="text-xs text-muted-foreground">{vibeLabels[v]}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground italic border-l border-border pl-4">hover any month to explore</span>
      </div>

      <DeltaInsights />

      {!session && (
        <div className="w-full max-w-2xl mx-auto mt-10 px-4">
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-lg px-6 py-4 text-center">
            <p className="text-sm text-foreground/80 font-serif">
              Love this? <a href="/auth" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors font-semibold">Create a free account</a> to map your own Reading River.
            </p>
          </div>
        </div>
      )}

      <RiverSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default RiverOfReading;
