import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MonthData, VibeGroup, vibeLabels, vibeHSL,
  getYears, readingData as defaultData,
} from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];

/**
 * Simple seeded pseudo-random noise for deterministic organic drift.
 * Returns values between -1 and 1 that vary smoothly.
 */
const seededNoise = (seed: number, i: number): number => {
  // Layer multiple sine waves with irrational-ish frequencies for pseudo-Perlin feel
  const s = seed;
  return (
    Math.sin(i * 0.137 + s * 7.31) * 0.4 +
    Math.sin(i * 0.071 + s * 13.7) * 0.3 +
    Math.sin(i * 0.213 + s * 3.19) * 0.2 +
    Math.sin(i * 0.043 + s * 19.1) * 0.1
  );
};

const DRIFT_DIR: Record<VibeGroup, number> = {
  escapist: -1, ideas: -0.55, nature: 0.7, history: 0.4, memoir: 1,
};

const MEANDER: Record<VibeGroup, { f1: number; f2: number; a1: number; a2: number; p: number }> = {
  escapist: { f1: 0.065, f2: 0.11, a1: 1, a2: 0.4, p: 0 },
  ideas:    { f1: 0.05,  f2: 0.09, a1: 0.8, a2: 0.35, p: 1.4 },
  nature:   { f1: 0.045, f2: 0.08, a1: 0.9, a2: 0.5, p: 2.9 },
  history:  { f1: 0.055, f2: 0.10, a1: 0.7, a2: 0.3, p: 4.2 },
  memoir:   { f1: 0.07,  f2: 0.12, a1: 0.85, a2: 0.45, p: 5.6 },
};

// Brighter center color for 3D cylindrical effect
const vibeBright: Record<VibeGroup, string> = {
  escapist: 'hsl(195, 70%, 65%)',
  ideas:    'hsl(210, 55%, 55%)',
  nature:   'hsl(160, 45%, 58%)',
  history:  'hsl(180, 50%, 48%)',
  memoir:   'hsl(220, 45%, 68%)',
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

  // Double-pass smoothed counts — carry forward last known value so future months don't collapse
  const smoothedCounts = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], memoir: [] };
    series.forEach(s => VIBES.forEach(v => raw[v].push(s.vibeBooks[v])));
    const out: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(v => {
      const smoothed = smooth(smooth(raw[v], 3), 2);
      // Carry forward: if a value drops to near-zero after the last real data,
      // hold the last significant value so rivers don't collapse
      let lastSignificant = 0;
      for (let i = smoothed.length - 1; i >= 0; i--) {
        if (smoothed[i] > 0.5) { lastSignificant = i; break; }
      }
      // From lastSignificant onward, hold a gentle fade but never below 40% of peak
      const peakVal = d3.max(smoothed)!;
      const holdMin = peakVal * 0.35;
      for (let i = lastSignificant + 1; i < smoothed.length; i++) {
        const fadeT = (i - lastSignificant) / 12; // fade over ~12 months
        smoothed[i] = Math.max(smoothed[i], holdMin * Math.max(0.3, 1 - fadeT * 0.5));
      }
      out[v] = smoothed;
    });
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

    const maxBooks = d3.max(VIBES, v => d3.max(smoothedCounts[v])!) || 1;
    const widthScale = d3.scaleLinear().domain([0, maxBooks]).range([1.5, 30]);
    const maxDrift = innerH * 0.38;

    const defs = svg.append('defs');

    // Filters
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Heavy blur for the membrane shadow
    const membraneBlur = defs.append('filter').attr('id', 'membrane-blur')
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    membraneBlur.append('feGaussianBlur').attr('stdDeviation', '18');

    const dotGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    dotGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const dm = dotGlow.append('feMerge');
    dm.append('feMergeNode').attr('in', 'blur');
    dm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Horizontal fade-out mask for right edge (delta dissolve)
    const fadeMask = defs.append('linearGradient')
      .attr('id', 'fade-right')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    fadeMask.append('stop').attr('offset', '0%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeMask.append('stop').attr('offset', '85%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeMask.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);

    const mask = defs.append('mask').attr('id', 'river-fade');
    mask.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'url(#fade-right)');

    // 3D cylindrical gradients — bright center, dark edges
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `cyl-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.15);
      lg.append('stop').attr('offset', '20%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.55);
      lg.append('stop').attr('offset', '45%').attr('stop-color', vibeBright[vibe]).attr('stop-opacity', 0.85);
      lg.append('stop').attr('offset', '55%').attr('stop-color', vibeBright[vibe]).attr('stop-opacity', 0.85);
      lg.append('stop').attr('offset', '80%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.55);
      lg.append('stop').attr('offset', '100%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.15);
    });

    // Compute braided center lines with FORCED convergence at origin
    type RiverPoint = { x: number; yTop: number; yBot: number; center: number };
    const riverPaths: Record<VibeGroup, RiverPoint[]> = {} as any;

    VIBES.forEach(vibe => {
      const counts = smoothedCounts[vibe];
      const { f1, f2, a1, a2, p } = MEANDER[vibe];
      const dir = DRIFT_DIR[vibe];

      const rawCenters = series.map((_, i) => {
        const t = i / (series.length - 1); // 0 at left (2021), 1 at right (2026)

        const volume = counts[i];
        const pushStrength = volume / maxBooks;

        // CONVERGENCE at LEFT (origin): strong pull at t=0, releasing rightward
        // e^(-6*(1-t)) is ~1 when t≈0 (left), ~0.0025 when t=1 (right)
        const originPull = Math.exp(-(1 - t) * 6);
        // Flip: we want pull=1 at left, pull=0 at right
        const convergencePull = 1 - originPull; // ~1 at t=0, ~0 at t=1

        // MAGNETIC CENTER weakens as we go right (delta spreads)
        // At t=0: full gravity. At t=1: only 20% gravity
        const gravityDecay = 1 - t * 0.8; // 1.0 → 0.2
        const gravity = (1 - pushStrength) * 0.5 * gravityDecay;

        const attractorStrength = Math.max(convergencePull, gravity);

        const driftAmount = maxDrift * pushStrength * dir * (1 - attractorStrength);

        // Meander scales up from zero at origin to full at the delta
        const meanderScale = originPull; // 0 at left, 1 at right
        const meander = (Math.sin(i * f1 + p) * a1 + Math.sin(i * f2 + p * 1.3) * a2) * 14 * meanderScale;

        return centerY + driftAmount + meander;
      });

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

    // Masked group — fades out at the right edge (delta dissolve)
    const riverGroup = g.append('g').attr('mask', 'url(#river-fade)');

    // === MEMBRANE: blurred shadow filling the space between all rivers ===
    const envelopeTop = series.map((_, i) => ({
      x: x(i),
      y: d3.min(VIBES, v => riverPaths[v][i].yTop)! - 8,
    }));
    const envelopeBot = series.map((_, i) => ({
      x: x(i),
      y: d3.max(VIBES, v => riverPaths[v][i].yBot)! + 8,
    }));

    const envelopeArea = d3.area<{ x: number; y: number }>()
      .x(d => d.x)
      .y0((_, i) => envelopeBot[i].y)
      .y1(d => d.y)
      .curve(d3.curveBasis);

    riverGroup.append('path')
      .datum(envelopeTop)
      .attr('d', envelopeArea)
      .attr('fill', 'hsl(190, 30%, 25%)')
      .attr('opacity', 0.03)
      .attr('filter', 'url(#membrane-blur)');

    // Per-tributary membrane connectors
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];
      const membraneArea = d3.area<RiverPoint>()
        .x(d => d.x)
        .y0(() => centerY)
        .y1(d => DRIFT_DIR[vibe] < 0 ? d.yBot : d.yTop)
        .curve(d3.curveBasis);

      riverGroup.append('path')
        .datum(pts)
        .attr('d', membraneArea)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.03)
        .attr('filter', 'url(#membrane-blur)');
    });

    // Draw each river with 3D cylindrical gradient
    const areaGen = d3.area<RiverPoint>()
      .x(d => d.x).y0(d => d.yBot).y1(d => d.yTop)
      .curve(d3.curveBasis);

    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];

      // Ambient glow
      riverGroup.append('path').datum(pts).attr('d', areaGen)
        .attr('fill', vibeHSL[vibe]).attr('opacity', 0.05)
        .attr('filter', 'url(#river-glow)');

      // Main fill — cylindrical gradient
      riverGroup.append('path').datum(pts).attr('d', areaGen)
        .attr('fill', `url(#cyl-${vibe})`);

      // Subtle highlight stroke
      const lineTopGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yTop).curve(d3.curveBasis);
      riverGroup.append('path').datum(pts).attr('d', lineTopGen)
        .attr('fill', 'none')
        .attr('stroke', 'hsla(0, 0%, 100%, 0.08)')
        .attr('stroke-width', 0.6);
    });

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

          VIBES.forEach(vibe => {
            if (smoothedCounts[vibe][i] < 0.3) return;
            const c = riverPaths[vibe][i].center;

            g.append('circle').attr('class', 'hover-el')
              .attr('cx', x(i)).attr('cy', c).attr('r', 7)
              .attr('fill', 'none')
              .attr('stroke', vibeBright[vibe])
              .attr('stroke-width', 1.5).attr('opacity', 0.5)
              .attr('filter', 'url(#dot-glow)');

            g.append('circle').attr('class', 'hover-el')
              .attr('cx', x(i)).attr('cy', c).attr('r', 3)
              .attr('fill', vibeBright[vibe]).attr('opacity', 0.9);

            // Connector to spine
            g.append('line').attr('class', 'hover-el')
              .attr('x1', x(i)).attr('y1', centerY)
              .attr('x2', x(i)).attr('y2', c)
              .attr('stroke', vibeHSL[vibe])
              .attr('stroke-width', 0.5).attr('opacity', 0.12)
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
