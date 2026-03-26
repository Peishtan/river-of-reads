import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  readingData, MonthData, VibeGroup, vibeLabels, vibeHSL,
  getYears,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];

/** 3-month moving average to smooth out zeros into gentle slopes */
const smooth = (arr: number[], radius = 2): number[] =>
  arr.map((_, i) => {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(arr.length - 1, i + radius); j++) {
      const w = 1 - Math.abs(j - i) / (radius + 1); // triangular weight
      sum += arr[j] * w;
      count += w;
    }
    return sum / count;
  });

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const years = useMemo(() => getYears(), []);

  // Build continuous monthly series
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
        if (found) {
          found.books.forEach(b => { vb[b.vibe] += 1; });
        }
        months.push({ monthIdx: mi, year: y, month: m, data: found, vibeBooks: vb });
      }
    }
    return months;
  }, [years]);

  // Smooth each vibe channel, then build smoothed series for stacking
  const smoothedSeries = useMemo(() => {
    const raw: Record<VibeGroup, number[]> = { escapist: [], ideas: [], nature: [], history: [], memoir: [] };
    series.forEach(s => {
      VIBES.forEach(v => raw[v].push(s.vibeBooks[v]));
    });

    const smoothed: Record<VibeGroup, number[]> = {} as any;
    VIBES.forEach(v => { smoothed[v] = smooth(raw[v], 2); });

    // Add a thin base "riverbed" so the stream never collapses to zero
    return series.map((s, i) => {
      const vb: Record<VibeGroup, number> = {} as any;
      VIBES.forEach(v => {
        vb[v] = Math.max(smoothed[v][i], 0.15); // minimum flow
      });
      return { ...s, vibeBooks: vb };
    });
  }, [series]);

  // D3 stack
  const stacked = useMemo(() => {
    const stack = d3.stack<typeof smoothedSeries[0], VibeGroup>()
      .keys(VIBES)
      .value((d, key) => d.vibeBooks[key])
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);
    return stack(smoothedSeries);
  }, [smoothedSeries]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1000);
    const height = 560;
    const vPad = Math.round(height * 0.15);
    const margin = { top: 50 + vPad, right: 130, bottom: 40 + vPad, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, smoothedSeries.length - 1])
      .range([0, innerW]);

    const yMin = d3.min(stacked, layer => d3.min(layer, d => d[0]))!;
    const yMax = d3.max(stacked, layer => d3.max(layer, d => d[1]))!;
    const yPadding = (yMax - yMin) * 0.1;
    const y = d3.scaleLinear().domain([yMin - yPadding, yMax + yPadding]).range([innerH, 0]);

    const defs = svg.append('defs');

    // Ambient glow filter
    const glow = defs.append('filter').attr('id', 'river-glow')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glow.append('feGaussianBlur').attr('stdDeviation', '10').attr('result', 'blur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Hover glow filter
    const hoverGlow = defs.append('filter').attr('id', 'dot-glow')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    hoverGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const hm = hoverGlow.append('feMerge');
    hm.append('feMergeNode').attr('in', 'blur');
    hm.append('feMergeNode').attr('in', 'SourceGraphic');

    // curveBasis area — the secret to liquid flow
    const area = d3.area<d3.SeriesPoint<typeof smoothedSeries[0]>>()
      .x((_, i) => x(i))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    // Year markers — ghost-like
    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < smoothedSeries.length) {
        g.append('line')
          .attr('x1', x(mi)).attr('y1', -vPad)
          .attr('x2', x(mi)).attr('y2', innerH + vPad)
          .attr('stroke', 'hsl(200, 4%, 15%)')
          .attr('stroke-width', 0.3)
          .attr('stroke-dasharray', '1 14');

        g.append('text')
          .attr('x', x(mi)).attr('y', -vPad + 12)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 5%, 30%)')
          .attr('font-size', '12px')
          .attr('font-weight', '400')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .text(yr);
      }
    });

    // Draw streams — 0.7 opacity for watery overlap
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];

      // Ambient glow under
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.06)
        .attr('filter', 'url(#river-glow)');

      // Main fill — 0.7 opacity for watery depth
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.7);

      // Soft white edge separator
      const lineGen = (accessor: (d: d3.SeriesPoint<typeof smoothedSeries[0]>) => number) =>
        d3.line<d3.SeriesPoint<typeof smoothedSeries[0]>>()
          .x((_, i) => x(i))
          .y(accessor)
          .curve(d3.curveBasis);

      [d => y(d[1]), d => y(d[0])].forEach(acc => {
        g.append('path')
          .datum(layer)
          .attr('d', lineGen(acc as any))
          .attr('fill', 'none')
          .attr('stroke', 'hsla(0, 0%, 100%, 0.07)')
          .attr('stroke-width', 1);
      });
    });

    // Right-side vibe labels
    const lastIdx = smoothedSeries.length - 1;
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];
      const lastPt = layer[lastIdx];
      const midY = (y(lastPt[0]) + y(lastPt[1])) / 2;
      const labelX = innerW + 18;

      g.append('line')
        .attr('x1', innerW + 3).attr('y1', midY)
        .attr('x2', labelX - 4).attr('y2', midY)
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.3);

      g.append('text')
        .attr('x', labelX).attr('y', midY + 4)
        .attr('fill', vibeHSL[vibe])
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.7)
        .text(vibeLabels[vibe]);
    });

    // Hover hitboxes — clean, single glowing dot
    const hitboxes = g.append('g').attr('class', 'hitboxes');
    const colW = innerW / smoothedSeries.length;

    smoothedSeries.forEach((s, i) => {
      const hitbox = hitboxes.append('rect')
        .attr('x', x(i) - colW / 2)
        .attr('y', -vPad)
        .attr('width', colW)
        .attr('height', innerH + vPad * 2)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer');

      hitbox.on('mouseenter', () => {
        if (s.data) {
          setHoveredMonth(s.data);
          setHoveredIdx(i);
          const px = margin.left + x(i);
          const py = margin.top - vPad;
          setTooltipPos({ x: (px / width) * 100, y: (py / height) * 100 });
        }

        // Ghost hover line
        g.selectAll('.hover-el').remove();
        g.append('line')
          .attr('class', 'hover-el')
          .attr('x1', x(i)).attr('y1', -vPad)
          .attr('x2', x(i)).attr('y2', innerH + vPad)
          .attr('stroke', 'hsla(0, 0%, 100%, 0.05)')
          .attr('stroke-width', 1);

        // Single glowing dot at the total stream center
        const totalTop = d3.min(stacked, layer => y(layer[i][1]))!;
        const totalBot = d3.max(stacked, layer => y(layer[i][0]))!;
        const centerY = (totalTop + totalBot) / 2;

        // Outer glow ring
        g.append('circle')
          .attr('class', 'hover-el')
          .attr('cx', x(i)).attr('cy', centerY)
          .attr('r', 8)
          .attr('fill', 'none')
          .attr('stroke', 'hsla(180, 40%, 70%, 0.3)')
          .attr('stroke-width', 2)
          .attr('filter', 'url(#dot-glow)');

        // Core dot
        g.append('circle')
          .attr('class', 'hover-el')
          .attr('cx', x(i)).attr('cy', centerY)
          .attr('r', 4)
          .attr('fill', 'hsl(180, 40%, 75%)')
          .attr('opacity', 0.9);
      });

      hitbox.on('mouseleave', () => {
        setHoveredMonth(null);
        setHoveredIdx(null);
        setTooltipPos(null);
        g.selectAll('.hover-el').remove();
      });
    });

  }, [smoothedSeries, stacked, years]);

  return (
    <div className="min-h-screen bg-[#0B1215] flex flex-col items-center px-2 py-8 overflow-x-auto">
      <header className="text-center mb-6 max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.18em] uppercase mb-1 font-serif">
          River of Reading
        </h1>
        <p className="text-sm text-muted-foreground font-light tracking-wide font-sans">
          A navigational log of Peishan's books — 2021 to present · width = books read · hover to explore
        </p>
      </header>

      <div ref={containerRef} className="relative w-full max-w-[1500px]" style={{ minWidth: 1000 }}>
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
