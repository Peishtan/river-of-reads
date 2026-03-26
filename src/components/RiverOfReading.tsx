import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MonthData, VibeGroup, vibeLabels, vibeHSL, VIBES,
} from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';
import MonthTooltip from './MonthTooltip';
import RiverSettings from './RiverSettings';
import DeltaInsights from './DeltaInsights';

const seededNoise = (seed: number, i: number): number => (
  Math.sin(i * 0.137 + seed * 7.31) * 0.4 +
  Math.sin(i * 0.071 + seed * 13.7) * 0.3 +
  Math.sin(i * 0.213 + seed * 3.19) * 0.2 +
  Math.sin(i * 0.043 + seed * 19.1) * 0.1
);

const DRIFT_DIR: Record<VibeGroup, number> = {
  escapist: -1, ideas: -0.55, nature: 0.7, history: 0.4, life: 1,
};

const MEANDER: Record<VibeGroup, { f1: number; f2: number; a1: number; a2: number; p: number }> = {
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

function brightenHSL(hsl: string): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hsl;
  const h = parseInt(m[1]), s = Math.min(100, parseInt(m[2]) + 10), l = Math.min(100, parseInt(m[3]) + 13);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Extract h,s,l numbers from hsl string */
function parseHSL(hsl: string): [number, number, number] | null {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: readingData, riverColors, session, signOut } = useReadingData();

  const years = useMemo(() => {
    const yrs = [...new Set(readingData.map(d => d.year))].sort();
    return yrs.length ? yrs : [2021];
  }, [readingData]);

  const series = useMemo(() => {
    const startYear = years[0];
    const endYear = years[years.length - 1];
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
          found.books.forEach(b => {
            b.vibes.forEach(v => { vb[v] += 1; vr[v] += b.rating; });
          });
        }
        months.push({ monthIdx: (y - startYear) * 12 + m, year: y, month: m, data: found, vibeBooks: vb, vibeRatingSum: vr });
      }
    }
    return months;
  }, [years, readingData]);

  const smoothedCounts = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [] };
    series.forEach(s => VIBES.forEach(v => raw[v].push(s.vibeBooks[v])));
    const out: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(v => {
      const smoothed = smooth(smooth(raw[v], 3), 2);
      let lastSignificant = 0;
      for (let i = smoothed.length - 1; i >= 0; i--) {
        if (smoothed[i] > 0.5) { lastSignificant = i; break; }
      }
      const peakVal = d3.max(smoothed)!;
      const holdMin = peakVal * 0.35;
      for (let i = lastSignificant + 1; i < smoothed.length; i++) {
        const fadeT = (i - lastSignificant) / 12;
        smoothed[i] = Math.max(smoothed[i], holdMin * Math.max(0.3, 1 - fadeT * 0.5));
      }
      out[v] = smoothed;
    });
    return out;
  }, [series]);

  const avgVibeRating = useMemo(() => {
    const out: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [] };
    series.forEach(s => {
      VIBES.forEach(v => {
        const count = s.vibeBooks[v];
        out[v].push(count > 0 ? s.vibeRatingSum[v] / count : 3);
      });
    });
    VIBES.forEach(v => { out[v] = smooth(out[v], 2); });
    return out;
  }, [series]);

  // --- Yearly "focus" factor: how concentrated reading is across vibes ---
  const yearlyFocus = useMemo(() => {
    const focusMap: Record<number, number> = {};
    const allYears = [...new Set(series.map(s => s.year))];
    allYears.forEach(yr => {
      const yrSeries = series.filter(s => s.year === yr);
      const totals: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0 };
      yrSeries.forEach(s => VIBES.forEach(v => { totals[v] += s.vibeBooks[v]; }));
      const total = Object.values(totals).reduce((a, b) => a + b, 0);
      if (total === 0) { focusMap[yr] = 0.5; return; }
      // Shannon entropy normalized to 0-1: 1 = diverse, 0 = focused
      let entropy = 0;
      VIBES.forEach(v => {
        const p = totals[v] / total;
        if (p > 0) entropy -= p * Math.log2(p);
      });
      focusMap[yr] = entropy / Math.log2(5);
    });
    return focusMap;
  }, [series]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const currentColors = { ...riverColors };
    const currentBright: Record<VibeGroup, string> = {} as any;
    VIBES.forEach(v => { currentBright[v] = brightenHSL(currentColors[v]); });

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1400);
    // 70vh height
    const height = Math.max(Math.round(window.innerHeight * 0.7), 500);
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
    // Power scale (exponent 0.5) so small streams are still visible
    const widthScale = d3.scalePow().exponent(0.5).domain([0, maxBooks]).range([2, 45]);
    const maxDrift = innerH * 0.38;

    const defs = svg.append('defs');

    // Filters
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const fm = glow.append('feMerge');
    fm.append('feMergeNode').attr('in', 'blur');
    fm.append('feMergeNode').attr('in', 'SourceGraphic');

    const membraneBlur = defs.append('filter').attr('id', 'membrane-blur')
      .attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    membraneBlur.append('feGaussianBlur').attr('stdDeviation', '18');

    const dotGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    dotGlow.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const dm = dotGlow.append('feMerge');
    dm.append('feMergeNode').attr('in', 'blur');
    dm.append('feMergeNode').attr('in', 'SourceGraphic');

    // High-rating glow filters per vibe
    VIBES.forEach(vibe => {
      const hsl = parseHSL(currentColors[vibe]);
      const glowFilter = defs.append('filter').attr('id', `loved-glow-${vibe}`)
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      glowFilter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
      if (hsl) {
        glowFilter.append('feFlood')
          .attr('flood-color', `hsl(${hsl[0]}, ${Math.min(100, hsl[1] + 20)}%, ${Math.min(100, hsl[2] + 15)}%)`)
          .attr('flood-opacity', '0.4').attr('result', 'color');
        glowFilter.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'colorBlur');
      }
      const gm = glowFilter.append('feMerge');
      gm.append('feMergeNode').attr('in', hsl ? 'colorBlur' : 'blur');
      gm.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    // RIGHT EDGE FEATHERED FADE — last 50px of the river area
    const fadePixels = 50;
    const fadeStart = Math.max(0, (innerW - fadePixels) / innerW);
    const fadeMask = defs.append('linearGradient')
      .attr('id', 'fade-right')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    fadeMask.append('stop').attr('offset', '0%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeMask.append('stop').attr('offset', `${fadeStart * 100}%`).attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeMask.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);

    const mask = defs.append('mask').attr('id', 'river-fade');
    mask.append('rect')
      .attr('width', innerW).attr('height', innerH)
      .attr('fill', 'url(#fade-right)');

    // Cylindrical gradients
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `cyl-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.15);
      lg.append('stop').attr('offset', '20%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.55);
      lg.append('stop').attr('offset', '45%').attr('stop-color', currentBright[vibe]).attr('stop-opacity', 0.85);
      lg.append('stop').attr('offset', '55%').attr('stop-color', currentBright[vibe]).attr('stop-opacity', 0.85);
      lg.append('stop').attr('offset', '80%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.55);
      lg.append('stop').attr('offset', '100%').attr('stop-color', currentColors[vibe]).attr('stop-opacity', 0.15);
    });

    // Inside-out ordering: most frequent vibe centered, others branch symmetrically
    const vibeTotals = VIBES.map(v => ({
      vibe: v,
      total: smoothedCounts[v].reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.total - a.total);

    // Assign vertical slots: center=0, then alternate +1,-1,+2,-2...
    const vibeOrder: { vibe: VibeGroup; slot: number }[] = [];
    vibeTotals.forEach((vt, idx) => {
      if (idx === 0) vibeOrder.push({ vibe: vt.vibe, slot: 0 });
      else {
        const half = Math.ceil(idx / 2);
        vibeOrder.push({ vibe: vt.vibe, slot: idx % 2 === 1 ? -half : half });
      }
    });

    type RiverPoint = { x: number; yTop: number; yBot: number; center: number; saturation: number; avgRating: number };
    const riverPaths: Record<VibeGroup, RiverPoint[]> = {} as any;

    vibeOrder.forEach(({ vibe, slot }) => {
      const counts = smoothedCounts[vibe];
      const ratings = avgVibeRating[vibe];
      const { f1, f2, a1, a2, p } = MEANDER[vibe];
      const dir = slot; // Use slot as drift direction

      const rawCenters = series.map((s, i) => {
        const t = i / (series.length - 1);
        const volume = counts[i];
        const pushStrength = volume / maxBooks;

        const focus = yearlyFocus[s.year] ?? 0.5;
        const huddleFactor = 0.4 + focus * 0.6;

        const originPull = Math.exp(-(1 - t) * 6);
        const convergencePull = 1 - originPull;
        const gravityDecay = 1 - t * 0.8;
        const gravity = (1 - pushStrength) * 0.5 * gravityDecay;
        const attractorStrength = Math.max(convergencePull, gravity);

        const normalizedDir = dir / Math.max(1, Math.ceil((VIBES.length - 1) / 2));
        const driftAmount = maxDrift * pushStrength * normalizedDir * (1 - attractorStrength) * huddleFactor;

        const meanderScale = originPull;
        const structuredMeander = (Math.sin(i * f1 + p) * a1 + Math.sin(i * f2 + p * 1.3) * a2) * 14;
        const noiseDrift = seededNoise(VIBES.indexOf(vibe) + 1, i) * 10;
        const meander = (structuredMeander + noiseDrift) * meanderScale;

        return centerY + driftAmount + meander;
      });

      const smoothCenters = smooth(smooth(rawCenters, 3), 2);

      riverPaths[vibe] = series.map((_, i) => {
        const c = smoothCenters[i];
        const halfW = Math.max(widthScale(Math.max(counts[i], 0.12)), 2.5);
        const ratingNorm = Math.max(0.3, (ratings[i] - 1) / 4);
        return { x: x(i), yTop: c - halfW, yBot: c + halfW, center: c, saturation: ratingNorm, avgRating: ratings[i] };
      });
    });

    // YEAR LABELS — serif, at very top, with thin tide lines
    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        // Year label
        g.append('text')
          .attr('x', x(mi)).attr('y', -20)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 8%, 38%)')
          .attr('font-size', '13px')
          .attr('font-weight', '600')
          .attr('font-family', "'Playfair Display', 'Georgia', serif")
          .attr('letter-spacing', '0.08em')
          .text(yr);

        // Thin vertical tide line from label to riverbed
        const bottommost = d3.max(VIBES, v => riverPaths[v][mi]?.yBot ?? centerY)! + 10;
        g.append('line')
          .attr('x1', x(mi)).attr('y1', -8)
          .attr('x2', x(mi)).attr('y2', bottommost)
          .attr('stroke', 'hsl(200, 8%, 38%)')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.05);
      }
    });

    const riverGroup = g.append('g').attr('mask', 'url(#river-fade)');

    // Membrane
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
        .attr('fill', currentColors[vibe])
        .attr('opacity', 0.03)
        .attr('filter', 'url(#membrane-blur)');
    });

    // Draw each river with per-segment opacity + HIGH RATING GLOW
    VIBES.forEach(vibe => {
      const pts = riverPaths[vibe];

      const segmentSize = 3;
      for (let si = 0; si < pts.length - 1; si += segmentSize) {
        const end = Math.min(si + segmentSize + 1, pts.length);
        const segment = pts.slice(si, end);
        const avgSat = segment.reduce((a, p) => a + p.saturation, 0) / segment.length;
        const avgRat = segment.reduce((a, p) => a + p.avgRating, 0) / segment.length;

        const segArea = d3.area<RiverPoint>()
          .x(d => d.x).y0(d => d.yBot).y1(d => d.yTop)
          .curve(d3.curveBasis);

        const path = riverGroup.append('path').datum(segment).attr('d', segArea)
          .attr('fill', currentBright[vibe])
          .attr('opacity', 0.15 + avgSat * 0.55);

        // Loved glow for segments with avg rating > 4.2
        if (avgRat > 4.2) {
          path.attr('filter', `url(#loved-glow-${vibe})`);
        }
      }

      // Ambient glow
      const areaGen = d3.area<RiverPoint>()
        .x(d => d.x).y0(d => d.yBot).y1(d => d.yTop)
        .curve(d3.curveBasis);

      riverGroup.append('path').datum(pts).attr('d', areaGen)
        .attr('fill', currentColors[vibe]).attr('opacity', 0.05)
        .attr('filter', 'url(#river-glow)');

      // Highlight stroke
      const lineTopGen = d3.line<RiverPoint>().x(d => d.x).y(d => d.yTop).curve(d3.curveBasis);
      riverGroup.append('path').datum(pts).attr('d', lineTopGen)
        .attr('fill', 'none')
        .attr('stroke', 'hsla(0, 0%, 100%, 0.08)')
        .attr('stroke-width', 0.6);
    });

    // Right-side labels
    const lastIdx = series.length - 1;
    VIBES.forEach(vibe => {
      const lastPt = riverPaths[vibe][lastIdx];
      const labelX = innerW + 16;

      g.append('line')
        .attr('x1', innerW + 2).attr('y1', lastPt.center)
        .attr('x2', labelX - 3).attr('y2', lastPt.center)
        .attr('stroke', currentColors[vibe]).attr('stroke-width', 0.4).attr('opacity', 0.25);

      g.append('text')
        .attr('x', labelX).attr('y', lastPt.center + 4)
        .attr('fill', currentColors[vibe])
        .attr('font-size', '10px').attr('font-weight', '400')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.6)
        .text(vibeLabels[vibe]);
    });

    // Helper: find nearest month with data
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
      if (nearest) {
        setHoveredMonth(nearest.data);
      }

      // Pin tooltip to mouse position relative to container
      if (event && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }

      g.selectAll('.hover-el').remove();

      VIBES.forEach(vibe => {
        if (smoothedCounts[vibe][i] < 0.3) return;
        const c = riverPaths[vibe][i].center;

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', x(i)).attr('cy', c).attr('r', 7)
          .attr('fill', 'none')
          .attr('stroke', currentBright[vibe])
          .attr('stroke-width', 1.5).attr('opacity', 0.5)
          .attr('filter', 'url(#dot-glow)');

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', x(i)).attr('cy', c).attr('r', 3)
          .attr('fill', currentBright[vibe]).attr('opacity', 0.9);

        g.append('line').attr('class', 'hover-el')
          .attr('x1', x(i)).attr('y1', centerY)
          .attr('x2', x(i)).attr('y2', c)
          .attr('stroke', currentColors[vibe])
          .attr('stroke-width', 0.5).attr('opacity', 0.12)
          .attr('stroke-dasharray', '2 4');
      });
    };

    const hideHover = () => {
      setHoveredMonth(null);
      setMousePos(null);
      g.selectAll('.hover-el').remove();
    };

    // Hover hitboxes
    const hitboxes = g.append('g');
    const colW = innerW / series.length;

    series.forEach((_, i) => {
      hitboxes.append('rect')
        .attr('x', x(i) - colW / 2).attr('y', 0)
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

  }, [series, smoothedCounts, avgVibeRating, years, riverColors, yearlyFocus]);

  // Dismiss tooltip on tap outside chart
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setHoveredMonth(null);
        setTooltipPos(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

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

      <div className="w-full max-w-[1800px] overflow-x-auto -webkit-overflow-scrolling-touch">
        <div ref={containerRef} className="relative" style={{ minWidth: 1200 }}>
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
      </div>

      <div className="flex flex-wrap items-center gap-5 mt-4 justify-center px-4">
        {VIBES.map(v => (
          <div key={v} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: riverColors[v], opacity: 0.7 }} />
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
