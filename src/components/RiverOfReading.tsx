import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MonthData, VibeGroup, vibeLabels, VIBES,
} from '@/data/readingData';
import { useReadingData } from '@/contexts/ReadingDataContext';
import MonthTooltip from './MonthTooltip';

import DeltaInsights from './DeltaInsights';

/* ── helpers ─────────────────────────────────────────────── */

const seededNoise = (seed: number, i: number): number => (
  Math.sin(i * 0.08 + seed * 7.31) * 0.4 +
  Math.sin(i * 0.04 + seed * 13.7) * 0.3 +
  Math.sin(i * 0.12 + seed * 3.19) * 0.2 +
  Math.sin(i * 0.025 + seed * 19.1) * 0.1
);

const MEANDER_CFG: Record<VibeGroup, { f1: number; f2: number; a1: number; a2: number; p: number }> = {
  escapist: { f1: 0.035, f2: 0.06, a1: 1, a2: 0.4, p: 0 },
  ideas:    { f1: 0.03,  f2: 0.05, a1: 0.8, a2: 0.35, p: 1.4 },
  nature:   { f1: 0.025, f2: 0.045, a1: 0.9, a2: 0.5, p: 2.9 },
  history:  { f1: 0.032, f2: 0.055, a1: 0.7, a2: 0.3, p: 4.2 },
  life:     { f1: 0.038, f2: 0.065, a1: 0.85, a2: 0.45, p: 5.6 },
  current:  { f1: 0.02,  f2: 0.035, a1: 0.5, a2: 0.2, p: 3.0 },
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

function lightenHSL(hsl: string, amount = 12): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hsl;
  return `hsl(${m[1]}, ${Math.max(0, parseInt(m[2]) - 5)}%, ${Math.min(95, parseInt(m[3]) + amount)}%)`;
}

/* ── component ───────────────────────────────────────────── */

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  

  const { data: rawReadingData, riverColors, session, signOut } = useReadingData();

  // Filter to 2021+ for visualization
  const readingData = useMemo(() => rawReadingData.filter(d => d.year >= 2021), [rawReadingData]);

  /* ── derived data ──────────────────────────────────────── */

  // Only include 'current' vibe if any books actually use it
  const activeVibes = useMemo(() => {
    const hasCurrentBooks = readingData.some(m => m.books.some(b => b.vibes.includes('current')));
    return hasCurrentBooks ? VIBES : VIBES.filter(v => v !== 'current');
  }, [readingData]);

  const years = useMemo(() => {
    const yrs = [...new Set(readingData.map(d => d.year))].sort();
    return yrs.length ? yrs : [2021];
  }, [readingData]);

  const series = useMemo(() => {
    const startYear = years[0], endYear = years[years.length - 1];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const months: {
      monthIdx: number; year: number; month: number;
      data: MonthData | null;
      vibeBooks: Record<VibeGroup, number>;
      vibeRatingSum: Record<VibeGroup, number>;
    }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 0; m < 12; m++) {
        // Stop at the current month — don't generate future empty months
        if (y > currentYear || (y === currentYear && m > currentMonth)) break;
        const found = readingData.find(d => d.year === y && d.month === m) || null;
        const vb: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
        const vr: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0, life: 0, current: 0 };
        if (found) {
          found.books.forEach(b => b.vibes.forEach(v => { vb[v]++; vr[v] += b.rating; }));
        }
        months.push({ monthIdx: (y - startYear) * 12 + m, year: y, month: m, data: found, vibeBooks: vb, vibeRatingSum: vr });
      }
    }
    return months;
  }, [years, readingData]);

  // Branch lifecycle: compute per-vibe alive mask with birth/death rules
  const vibeLifecycle = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [], current: [] };
    series.forEach(s => activeVibes.forEach(v => raw[v].push(s.vibeBooks[v])));

    const lifecycle: Record<VibeGroup, number[]> = {} as any;
    activeVibes.forEach(v => {
      const counts = raw[v];
      const mask = new Array(counts.length).fill(0);
      let alive = false;
      let birthIdx = -1;
      let deathIdx = -1;

      for (let i = 0; i < counts.length; i++) {
        if (!alive) {
          // Birth rule: 3 months with books in a 6-month window
          const windowStart = Math.max(0, i - 5);
          let activeInWindow = 0;
          for (let j = windowStart; j <= i; j++) {
            if (counts[j] > 0) activeInWindow++;
          }
          if (activeInWindow >= 3) {
            alive = true;
            birthIdx = i;
            deathIdx = -1;
          }
        } else {
          // Death rule: 6 consecutive months with 0 books
          let consecutiveZero = 0;
          for (let j = i; j >= Math.max(0, i - 5); j--) {
            if (counts[j] === 0) consecutiveZero++;
            else break;
          }
          if (consecutiveZero >= 6) {
            alive = false;
            deathIdx = i - 5; // death started 6 months ago
          }
        }
        mask[i] = alive ? 1 : 0;
      }

      // Apply growth ramp on birth (0→1 over 3 months)
      // Apply fade-out ramp on death (1→0 over 3 months)
      const ramped = [...mask];

      // Find birth/death transitions and apply ramps
      for (let i = 1; i < ramped.length; i++) {
        // Birth ramp: first 3 months after becoming alive
        if (mask[i] === 1 && mask[i - 1] === 0) {
          // Ramp up over 3 months
          for (let r = 0; r < 3 && i + r < ramped.length; r++) {
            if (mask[i + r] === 1) {
              ramped[i + r] = Math.min(ramped[i + r], (r + 1) / 3);
            }
          }
        }
        // Death ramp: 3 months before dying
        if (mask[i] === 0 && mask[i - 1] === 1) {
          for (let r = 1; r <= 3; r++) {
            const idx = i - r;
            if (idx >= 0 && mask[idx] === 1) {
              ramped[idx] = Math.min(ramped[idx], r / 3);
            }
          }
        }
      }

      lifecycle[v] = ramped;
    });
    return lifecycle;
  }, [series, activeVibes]);

  // Smoothed counts multiplied by lifecycle mask
  const smoothedCounts = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [], current: [] };
    series.forEach(s => activeVibes.forEach(v => raw[v].push(s.vibeBooks[v])));
    const out: Record<VibeGroup, number[]> = {} as any;
    activeVibes.forEach(v => {
      const s = smooth(smooth(raw[v], 3), 2);
      // Apply lifecycle mask
      for (let i = 0; i < s.length; i++) {
        s[i] *= vibeLifecycle[v][i];
      }
      out[v] = s;
    });
    return out;
  }, [series, vibeLifecycle]);

  // Average rating per vibe per month
  const avgVibeRating = useMemo(() => {
    const out: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], life: [], current: [] };
    series.forEach(s => activeVibes.forEach(v => {
      const c = s.vibeBooks[v];
      out[v].push(c > 0 ? s.vibeRatingSum[v] / c : 3);
    }));
    activeVibes.forEach(v => { out[v] = smooth(out[v], 2); });
    return out;
  }, [series]);

  /* ── D3 rendering ──────────────────────────────────────── */

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const currentColors: Record<VibeGroup, string> = {} as any;
    const rippleColors: Record<VibeGroup, string> = {} as any;
    activeVibes.forEach(v => {
      currentColors[v] = riverColors[v];
      rippleColors[v] = lightenHSL(riverColors[v], 15);
    });

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1400);
    const height = Math.max(Math.round(window.innerHeight * 0.7), 500);
    const margin = { top: 55, right: 30, bottom: 40, left: 60 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, series.length - 1]).range([0, innerW]);
    const defs = svg.append('defs');

    // Right-edge feathered fade
    const fadeStart = Math.max(0, (innerW - 60) / innerW);
    const fadeGrad = defs.append('linearGradient').attr('id', 'fade-right')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    fadeGrad.append('stop').attr('offset', '0%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeGrad.append('stop').attr('offset', `${fadeStart * 100}%`).attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeGrad.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);

    // Vertical edge softening — top/bottom banks fade
    const fadeVert = defs.append('linearGradient').attr('id', 'fade-vert')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    fadeVert.append('stop').attr('offset', '0%').attr('stop-color', 'black').attr('stop-opacity', 1);
    fadeVert.append('stop').attr('offset', '3%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeVert.append('stop').attr('offset', '97%').attr('stop-color', 'white').attr('stop-opacity', 1);
    fadeVert.append('stop').attr('offset', '100%').attr('stop-color', 'black').attr('stop-opacity', 1);

    // Combined mask using filter to multiply both gradients
    const fadeMask = defs.append('mask').attr('id', 'river-fade');
    const maskG = fadeMask.append('g');
    maskG.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'url(#fade-vert)');
    // Apply right fade as a second mask layer
    const fadeMask2 = defs.append('mask').attr('id', 'river-fade-h');
    fadeMask2.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'url(#fade-right)');


    /* ── D3 stack with wiggle + insideOut ─────────────────── */

    // Power-scale the counts so thin months still feel substantial
    const powerScale = d3.scalePow().exponent(0.6).domain([0, d3.max(activeVibes, v => d3.max(smoothedCounts[v])!)!]).range([0.15, 1]);

    // Build stack data: array of { idx, escapist, ideas, ... }
    const stackData = series.map((_, i) => {
      const row: Record<string, number> = { idx: i };
      activeVibes.forEach(v => {
        const count = smoothedCounts[v][i];
        row[v] = count < 0.05 ? 0 : powerScale(count);
      });
      return row;
    });

    // Custom order: 'current' always in the center (highest sum), others branch outward
    const stack = d3.stack<Record<string, number>>()
      .keys(activeVibes as string[])
      .offset(d3.stackOffsetWiggle)
      .order((series) => {
        // insideOut puts highest-sum keys in the center; force 'current' to have the highest sum
        const sums = series.map((s, i) => ({
          i,
          sum: activeVibes[i] === 'current'
            ? Infinity
            : d3.sum(s, d => d[1] - d[0]),
        }));
        sums.sort((a, b) => b.sum - a.sum);
        // insideOut interleaving: largest in center, alternating sides
        const order: number[] = [];
        let top = 0, bottom = 0;
        for (let j = 0; j < sums.length; j++) {
          if (j % 2 === 0) {
            order.splice(Math.floor(order.length / 2) + top, 0, sums[j].i);
            top++;
          } else {
            order.splice(Math.floor(order.length / 2) - bottom + 1, 0, sums[j].i);
            bottom++;
          }
        }
        return order;
      });

    const stackedLayers = stack(stackData);

    // Scale Y to fill the full container height
    const yExtent = [
      d3.min(stackedLayers, layer => d3.min(layer, d => d[0]))!,
      d3.max(stackedLayers, layer => d3.max(layer, d => d[1]))!,
    ];
    const yScale = d3.scaleLinear().domain(yExtent).range([innerH * 0.05, innerH * 0.95]);

    // Compute per-vibe meander offsets (organic drift applied to the stack baseline)
    const meanderOffsets: Record<VibeGroup, number[]> = {} as any;
    activeVibes.forEach(vibe => {
      const { f1, f2, a1, a2, p } = MEANDER_CFG[vibe];
      meanderOffsets[vibe] = series.map((_, i) => {
        const t = i / (series.length - 1);
        const rampUp = 1 - Math.exp(-t * 4); // start tight, diverge
        const meander = (Math.sin(i * f1 + p) * a1 + Math.sin(i * f2 + p * 1.3) * a2) * 8;
        const noise = seededNoise(activeVibes.indexOf(vibe) + 1, i) * 5;
        return (meander + noise) * rampUp;
      });
    });

    /* ── Global stats (top-left) ────────────────────────── */

    const totalBooks = readingData.reduce((a, m) => a + m.books.length, 0);
    const yearsLogged = years.length;
    g.append('text')
      .attr('x', 0).attr('y', -30)
      .attr('fill', 'hsl(200, 10%, 58%)')
      .attr('font-size', '12px').attr('font-weight', '400')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('opacity', 0.85)
      .text(`${totalBooks} books · ${yearsLogged} years`);

    /* ── Year labels ─────────────────────────────────────── */

    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        // Tick line — ultra-faint vertical marker
        g.append('line')
          .attr('x1', xScale(mi)).attr('y1', -4)
          .attr('x2', xScale(mi)).attr('y2', innerH)
          .attr('stroke', 'hsl(200, 8%, 38%)')
          .attr('stroke-width', 0.5).attr('opacity', 0.08);

        // Year label — close to the river
        g.append('text')
          .attr('x', xScale(mi)).attr('y', -6)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 10%, 60%)')
          .attr('font-size', '12px').attr('font-weight', '600')
          .attr('font-family', "'Playfair Display', 'Georgia', serif")
          .attr('letter-spacing', '0.08em')
          .text(yr);
      }
    });

    /* ── Tide markers (horizontal volume scale) ──────────── */

    const maxBooks = d3.max(series, s => s.data ? s.data.books.length : 0) || 10;
    [5, 10].forEach(mark => {
      if (mark > maxBooks + 2) return; // skip if irrelevant
      // Map book count to Y via the power scale used for stacking
      const yVal = yScale(yExtent[0] + (yExtent[1] - yExtent[0]) * (mark / Math.max(maxBooks, 12)));
      g.append('line')
        .attr('x1', 0).attr('y1', yVal)
        .attr('x2', innerW).attr('y2', yVal)
        .attr('stroke', 'hsl(200, 8%, 38%)')
        .attr('stroke-width', 0.5).attr('opacity', 0.04)
        .attr('stroke-dasharray', '4,6');
      g.append('text')
        .attr('x', -8).attr('y', yVal + 3)
        .attr('text-anchor', 'end')
        .attr('fill', 'hsl(200, 10%, 55%)')
        .attr('font-size', '10px').attr('opacity', 0.5)
        .attr('font-family', "'Source Sans 3', sans-serif")
        .text(mark);
    });

    /* ── Glow filter ────────────────────────────────────── */
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '6').attr('result', 'blur');
    glow.append('feColorMatrix').attr('in', 'blur').attr('type', 'saturate').attr('values', '1.3').attr('result', 'glow');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'glow');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /* ── Draw rivers ─────────────────────────────────────── */

    const riverOuter = g.append('g').attr('mask', 'url(#river-fade)').attr('filter', 'url(#river-glow)');
    const riverGroup = riverOuter.append('g').attr('mask', 'url(#river-fade-h)');

    // Store computed paths for hover lookups
    type LayerPoint = { x: number; y0: number; y1: number; center: number };
    const layerPaths: Record<VibeGroup, LayerPoint[]> = {} as any;

    stackedLayers.forEach(layer => {
      const vibe = layer.key as VibeGroup;
      const meanderOff = meanderOffsets[vibe];
      

      // Compute points with meander applied
      const GAP = 4; // pixel gap between adjacent streams
      const pts: LayerPoint[] = layer.map((d, i) => {
        const mx = meanderOff[i];
        const rawY0 = yScale(d[0]) + mx;
        const rawY1 = yScale(d[1]) + mx;
        const thickness = rawY1 - rawY0;
        const inset = thickness > GAP * 2 ? GAP / 2 : 0;
        const y0 = rawY0 + inset;
        const y1 = rawY1 - inset;
        return { x: xScale(i), y0, y1, center: (y0 + y1) / 2 };
      });
      layerPaths[vibe] = pts;

      // ── Main fill — opacity driven by average book rating per month
      // We slice the stream into segments so each month-span can have its own opacity
      const ratings = avgVibeRating[vibe];
      for (let i = 0; i < pts.length - 1; i++) {
        const segPts = [pts[i], pts[Math.min(i + 1, pts.length - 1)]];
        // Map rating (1-5) to opacity (0.45-0.92)
        const avgR = (ratings[i] + ratings[Math.min(i + 1, ratings.length - 1)]) / 2;
        const opacity = 0.45 + (Math.min(Math.max(avgR, 1), 5) - 1) * (0.47 / 4);

        const segArea = d3.area<LayerPoint>()
          .x(d => d.x).y0(d => d.y0).y1(d => d.y1)
          .curve(d3.curveLinear);

        riverGroup.append('path').datum(segPts).attr('d', segArea)
          .attr('fill', currentColors[vibe])
          .attr('opacity', opacity);
      }

      // ── Top edge 'ripple' stroke
      const topLine = d3.line<LayerPoint>().x(d => d.x).y(d => d.y1).curve(d3.curveBasis);
      riverGroup.append('path').datum(pts).attr('d', topLine)
        .attr('fill', 'none')
        .attr('stroke', rippleColors[vibe])
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5);
    });

    /* ── Decorative ambient tributaries ───────────────────── */
    // Thin, faint streams that branch off main rivers for organic feel
    const ambientStreams = [
      { parentVibe: 'escapist' as VibeGroup, seed: 42, yOff: -18, side: 'top' },
      { parentVibe: 'ideas' as VibeGroup, seed: 77, yOff: 14, side: 'bottom' },
      { parentVibe: 'nature' as VibeGroup, seed: 23, yOff: -12, side: 'top' },
      { parentVibe: 'life' as VibeGroup, seed: 91, yOff: 16, side: 'bottom' },
    ];

    ambientStreams.forEach(({ parentVibe, seed, yOff, side }) => {
      const parent = layerPaths[parentVibe];
      if (!parent || parent.length < 4) return;

      // Branch off partway through
      const branchStart = Math.floor(parent.length * (0.15 + (seed % 30) / 100));
      const branchEnd = Math.min(parent.length - 1, branchStart + Math.floor(parent.length * 0.55));

      const tributaryPts: { x: number; y: number }[] = [];
      for (let i = branchStart; i <= branchEnd; i++) {
        const t = (i - branchStart) / (branchEnd - branchStart);
        // Ramp up from parent, meander, then fade out
        const ramp = Math.sin(t * Math.PI); // 0→1→0 envelope
        const baseY = side === 'top' ? parent[i].y0 : parent[i].y1;
        const drift = yOff * ramp * (1 + Math.sin(i * 0.15 + seed) * 0.4);
        const wiggle = Math.sin(i * 0.08 + seed * 3.7) * 6 * ramp
          + Math.sin(i * 0.13 + seed * 1.9) * 3 * ramp;
        tributaryPts.push({ x: parent[i].x, y: baseY + drift + wiggle });
      }

      const line = d3.line<{ x: number; y: number }>()
        .x(d => d.x).y(d => d.y).curve(d3.curveBasis);

      // Thin fill stroke to give it slight width
      riverGroup.append('path').datum(tributaryPts).attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', currentColors[parentVibe])
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.25)
        .attr('stroke-linecap', 'round');

      // Even thinner bright edge
      riverGroup.append('path').datum(tributaryPts).attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', rippleColors[parentVibe])
        .attr('stroke-width', 0.7)
        .attr('opacity', 0.3)
        .attr('stroke-linecap', 'round');
    });

    /* ── Flow particles ──────────────────────────────────── */
    // Animated dots drifting along each river's center line
    const flowGroup = riverOuter.append('g').attr('class', 'flow-particles');

    activeVibes.forEach((vibe, vi) => {
      const pts = layerPaths[vibe];
      if (!pts || pts.length < 4) return;

      // Build a center-line path for motion
      const centerLine = d3.line<LayerPoint>()
        .x(d => d.x).y(d => d.center).curve(d3.curveBasis);
      const pathData = centerLine(pts);
      if (!pathData) return;

      // Hidden motion path
      const motionPath = defs.append('path')
        .attr('id', `flow-path-${vibe}`)
        .attr('d', pathData);

      // Get path length for duration calc
      const pathNode = motionPath.node() as SVGPathElement;
      if (!pathNode) return;
      const pathLen = pathNode.getTotalLength();

      // Spawn a few particles per stream, staggered
      const particleCount = 3;
      for (let p = 0; p < particleCount; p++) {
        const dur = 12 + vi * 1.5 + p * 2; // seconds, varied per stream
        const delay = -(dur / particleCount) * p; // stagger evenly

        const particle = flowGroup.append('circle')
          .attr('r', 1.8)
          .attr('fill', rippleColors[vibe])
          .attr('opacity', 0);

        // Use SMIL animate for smooth GPU-friendly motion
        particle.append('animateMotion')
          .attr('dur', `${dur}s`)
          .attr('repeatCount', 'indefinite')
          .attr('begin', `${delay}s`)
          .append('mpath')
          .attr('xlink:href', `#flow-path-${vibe}`);

        // Fade in at start, fade out at end
        particle.append('animate')
          .attr('attributeName', 'opacity')
          .attr('values', '0;0.4;0.5;0.4;0')
          .attr('keyTimes', '0;0.1;0.5;0.9;1')
          .attr('dur', `${dur}s`)
          .attr('repeatCount', 'indefinite')
          .attr('begin', `${delay}s`);

        // Subtle size pulse
        particle.append('animate')
          .attr('attributeName', 'r')
          .attr('values', '1.2;2;1.5;2.2;1.2')
          .attr('dur', `${dur * 0.7}s`)
          .attr('repeatCount', 'indefinite')
          .attr('begin', `${delay}s`);
      }
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

      if (event) {
        setMousePos({ x: event.clientX, y: event.clientY });
      }

      g.selectAll('.hover-el').remove();

      activeVibes.forEach(vibe => {
        if (smoothedCounts[vibe][i] < 0.3) return;
        const c = layerPaths[vibe][i].center;

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', xScale(i)).attr('cy', c).attr('r', 5)
          .attr('fill', 'none').attr('stroke', rippleColors[vibe])
          .attr('stroke-width', 1).attr('opacity', 0.6);

        g.append('circle').attr('class', 'hover-el')
          .attr('cx', xScale(i)).attr('cy', c).attr('r', 2)
          .attr('fill', rippleColors[vibe]).attr('opacity', 0.8);
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
          setMousePos({ x: event.clientX, y: event.clientY });
        })
        .on('mouseleave', hideHover)
        .on('click', (event: MouseEvent) => showHover(i, event));
    });

  }, [series, smoothedCounts, avgVibeRating, years, riverColors, activeVibes]);

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
          Tributaries emerge when genres surge · hover to explore
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          {session && (
            <a href="/upload" className="text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4">
              Import your data →
            </a>
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
          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">Viewing Peishan's books</p>
        )}
      </header>

      <div className="w-full max-w-[1800px] overflow-x-auto px-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div ref={containerRef} className="relative" style={{ minWidth: 1200 }}>
          <svg ref={svgRef} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" />
        </div>
      </div>

      {hoveredMonth && mousePos && (() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tooltipW = 260;
        const tooltipH = 200;
        // Clamp position so tooltip never leaves viewport
        let left = mousePos.x + 16;
        let top = mousePos.y - tooltipH - 8;
        // Flip right → left if clipped
        if (left + tooltipW > vw - 8) {
          left = mousePos.x - tooltipW - 16;
        }
        // Clamp left edge
        if (left < 8) left = 8;
        // Flip up → down if clipped
        if (top < 8) {
          top = mousePos.y + 16;
        }
        // Clamp bottom edge
        if (top + tooltipH > vh - 8) {
          top = vh - tooltipH - 8;
        }
        return (
          <div
            className="fixed z-50 pointer-events-none animate-fade-up"
            style={{
              left: `${left}px`,
              top: `${top}px`,
            }}
          >
            <MonthTooltip data={hoveredMonth} />
          </div>
        );
      })()}

      <div className="flex flex-wrap items-center gap-5 mt-4 justify-center px-4">
        {activeVibes.map(v => {
          const count = readingData.reduce((a, m) => a + m.books.filter(b => b.vibes.includes(v)).length, 0);
          return (
            <div key={v} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riverColors[v], opacity: 0.85 }} />
              <span className="text-[12px] text-muted-foreground">{vibeLabels[v]}</span>
              <span className="text-[11px] text-muted-foreground/70">{count}</span>
            </div>
          );
        })}
      </div>

      <DeltaInsights />

      <div className="w-full max-w-2xl mx-auto mt-10 px-4 mb-8">
        <div className="bg-card/40 backdrop-blur-sm border border-border rounded-lg px-6 py-5">
          <h2 className="text-lg font-serif font-bold text-foreground mb-3">About this River</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              This visualization maps a reading life as a flowing river. Each tributary represents a different genre or mood —
              they emerge when a category surges, meander through time, and fade when the current shifts elsewhere.
            </p>
            <p>
              <strong className="text-foreground/80">How it stays up to date:</strong> My rivers are updated automatically
              via an n8n pipeline I've created from <a href="https://www.goodreads.com/review/list_rss/13139577-peishan-tan?shelf=read" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">Goodreads</a>.
            </p>
            <p>
              <strong className="text-foreground/80">Make your own:</strong> You don't need Goodreads or any automation —
              just <a href="/auth" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">create an account</a> and{' '}
              <a href="/upload" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">upload a CSV</a> of
              your reading history. Any spreadsheet with titles, dates, ratings, and genre tags will work.
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default RiverOfReading;
