import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  readingData, MonthData, VibeGroup, vibeLabels, vibeHSL,
  getYears,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history', 'memoir'];

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
        if (found) {
          found.books.forEach(b => { vb[b.vibe] += 1; });
        }
        months.push({ monthIdx: mi, year: y, month: m, data: found, vibeBooks: vb });
      }
    }
    return months;
  }, [years]);

  const stacked = useMemo(() => {
    const stack = d3.stack<typeof series[0], VibeGroup>()
      .keys(VIBES)
      .value((d, key) => d.vibeBooks[key])
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);
    return stack(series);
  }, [series]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 1000);
    const height = 560;
    // 15% vertical padding so river can meander
    const vPad = Math.round(height * 0.15);
    const margin = { top: 60 + vPad, right: 130, bottom: 40 + vPad, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, series.length - 1])
      .range([0, innerW]);

    const yMin = d3.min(stacked, layer => d3.min(layer, d => d[0]))!;
    const yMax = d3.max(stacked, layer => d3.max(layer, d => d[1]))!;
    const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]);

    const defs = svg.append('defs');

    // Soft outer glow
    const filter = defs.append('filter').attr('id', 'stream-glow')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradients — watery, semi-transparent
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `grad-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.12);
      lg.append('stop').attr('offset', '15%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '85%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '100%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.12);
    });

    // curveBasis area generator
    const area = d3.area<d3.SeriesPoint<typeof series[0]>>()
      .x((_, i) => x(i))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    // Year markers — barely visible
    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        g.append('line')
          .attr('x1', x(mi)).attr('y1', -vPad)
          .attr('x2', x(mi)).attr('y2', innerH + vPad)
          .attr('stroke', 'hsl(200, 5%, 16%)')
          .attr('stroke-width', 0.3)
          .attr('stroke-dasharray', '1 12');

        g.append('text')
          .attr('x', x(mi)).attr('y', -vPad + 14)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 6%, 32%)')
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .text(yr);
      }
    });

    // Draw streams — glow + fill + soft white separator
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];

      // Glow under-layer
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.08)
        .attr('filter', 'url(#stream-glow)');

      // Main fill
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', `url(#grad-${vibe})`)
        .attr('opacity', 0.8);

      // Semi-transparent white separator strokes
      const lineGen = (accessor: (d: d3.SeriesPoint<typeof series[0]>) => number) =>
        d3.line<d3.SeriesPoint<typeof series[0]>>()
          .x((_, i) => x(i))
          .y(accessor)
          .curve(d3.curveBasis);

      g.append('path')
        .datum(layer)
        .attr('d', lineGen(d => y(d[1])))
        .attr('fill', 'none')
        .attr('stroke', 'hsla(0, 0%, 100%, 0.1)')
        .attr('stroke-width', 1.5);

      g.append('path')
        .datum(layer)
        .attr('d', lineGen(d => y(d[0])))
        .attr('fill', 'none')
        .attr('stroke', 'hsla(0, 0%, 100%, 0.1)')
        .attr('stroke-width', 1.5);
    });

    // NO gold markers in default view — only on hover

    // Right-side vibe labels
    const lastIdx = series.length - 1;
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];
      const lastPt = layer[lastIdx];
      const midY = (y(lastPt[0]) + y(lastPt[1])) / 2;
      const labelX = innerW + 18;

      g.append('line')
        .attr('x1', innerW + 3).attr('y1', midY)
        .attr('x2', labelX - 4).attr('y2', midY)
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 0.6)
        .attr('opacity', 0.35);

      g.append('text')
        .attr('x', labelX).attr('y', midY + 4)
        .attr('fill', vibeHSL[vibe])
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .attr('opacity', 0.8)
        .text(vibeLabels[vibe]);
    });

    // Bottom year book counts
    years.forEach(yr => {
      const count = readingData.filter(d => d.year === yr).reduce((a, d) => a + d.books.length, 0);
      const mi = (yr - startYear) * 12 + 6;
      if (mi < series.length) {
        g.append('text')
          .attr('x', x(mi)).attr('y', innerH + vPad - 6)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 6%, 30%)')
          .attr('font-size', '10px')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .attr('opacity', 0.4)
          .text(`${count} books`);
      }
    });

    // Hover hitboxes
    const hitboxes = g.append('g').attr('class', 'hitboxes');
    const colW = innerW / series.length;

    series.forEach((s, i) => {
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
          const px = margin.left + x(i);
          const py = margin.top - vPad;
          setTooltipPos({ x: (px / width) * 100, y: (py / height) * 100 });
        }

        // Faint hover line
        g.selectAll('.hover-line').remove();
        g.append('line')
          .attr('class', 'hover-line')
          .attr('x1', x(i)).attr('y1', -vPad)
          .attr('x2', x(i)).attr('y2', innerH + vPad)
          .attr('stroke', 'hsla(0, 0%, 100%, 0.08)')
          .attr('stroke-width', 1);

        // Show gold dots ONLY on hover for 5-star books
        g.selectAll('.hover-dot').remove();
        stacked.forEach((layer, li) => {
          const vibe = VIBES[li];
          const pt = layer[i];
          const thickness = y(pt[0]) - y(pt[1]);
          if (thickness < 2) return;
          const midY = (y(pt[0]) + y(pt[1])) / 2;

          // Stream dot
          g.append('circle')
            .attr('class', 'hover-dot')
            .attr('cx', x(i)).attr('cy', midY)
            .attr('r', 3.5)
            .attr('fill', vibeHSL[vibe])
            .attr('stroke', 'hsla(0, 0%, 100%, 0.3)')
            .attr('stroke-width', 0.8);

          // Gold 5-star markers on hover only
          if (s.data) {
            const fiveStars = s.data.books.filter(b => b.vibe === vibe && b.rating === 5);
            if (fiveStars.length > 0) {
              g.append('circle')
                .attr('class', 'hover-dot')
                .attr('cx', x(i)).attr('cy', midY)
                .attr('r', 5)
                .attr('fill', 'none')
                .attr('stroke', 'hsl(43, 90%, 58%)')
                .attr('stroke-width', 1.5)
                .attr('opacity', 0.8);
            }
          }
        });
      });

      hitbox.on('mouseleave', () => {
        setHoveredMonth(null);
        setTooltipPos(null);
        g.selectAll('.hover-line').remove();
        g.selectAll('.hover-dot').remove();
      });
    });

  }, [series, stacked, years]);

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
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: vibeHSL[v] }} />
            <span className="text-xs text-muted-foreground">{vibeLabels[v]}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground italic border-l border-border pl-4">hover to reveal 5★ markers</span>
      </div>
    </div>
  );
};

export default RiverOfReading;
