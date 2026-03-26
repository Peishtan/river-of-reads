import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  readingData, MonthData, VibeGroup, vibeLabels, vibeHSL,
  totalPages, getYears, toMonthIndex,
} from '@/data/readingData';
import MonthTooltip from './MonthTooltip';

const VIBES: VibeGroup[] = ['escapist', 'ideas', 'nature', 'history'];

const RiverOfReading = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const years = useMemo(() => getYears(), []);

  // Build continuous monthly series (fill gaps with 0)
  const series = useMemo(() => {
    const startYear = years[0];
    const endYear = years[years.length - 1];
    const months: { monthIdx: number; year: number; month: number; data: MonthData | null; vibePages: Record<VibeGroup, number> }[] = [];

    for (let y = startYear; y <= endYear; y++) {
      for (let m = 0; m < 12; m++) {
        const mi = (y - startYear) * 12 + m;
        const found = readingData.find(d => d.year === y && d.month === m) || null;
        const vp: Record<VibeGroup, number> = { escapist: 0, ideas: 0, nature: 0, history: 0 };
        if (found) {
          found.books.forEach(b => { vp[b.vibe] += b.pages; });
        }
        months.push({ monthIdx: mi, year: y, month: m, data: found, vibePages: vp });
      }
    }
    return months;
  }, [years]);

  // D3 stack
  const stacked = useMemo(() => {
    const stack = d3.stack<typeof series[0], VibeGroup>()
      .keys(VIBES)
      .value((d, key) => d.vibePages[key])
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);

    return stack(series);
  }, [series]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = Math.max(container.clientWidth, 900);
    const height = 500;
    const margin = { top: 60, right: 140, bottom: 50, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, series.length - 1])
      .range([0, innerW]);

    const yExtent = [
      d3.min(stacked, layer => d3.min(layer, d => d[0]))!,
      d3.max(stacked, layer => d3.max(layer, d => d[1]))!,
    ];
    const y = d3.scaleLinear()
      .domain(yExtent)
      .range([innerH, 0]);

    // Defs
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'stream-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gradients for each vibe
    VIBES.forEach(vibe => {
      const lg = defs.append('linearGradient')
        .attr('id', `grad-${vibe}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
      lg.append('stop').attr('offset', '0%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.3);
      lg.append('stop').attr('offset', '30%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '70%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.7);
      lg.append('stop').attr('offset', '100%').attr('stop-color', vibeHSL[vibe]).attr('stop-opacity', 0.3);
    });

    // Area generator
    const area = d3.area<d3.SeriesPoint<typeof series[0]>>()
      .x((_, i) => x(i))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    // Year grid lines
    const startYear = years[0];
    years.forEach(yr => {
      const mi = (yr - startYear) * 12;
      if (mi >= 0 && mi < series.length) {
        g.append('line')
          .attr('x1', x(mi)).attr('y1', -10)
          .attr('x2', x(mi)).attr('y2', innerH + 10)
          .attr('stroke', 'hsl(200, 10%, 20%)')
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', '4 6');

        g.append('text')
          .attr('x', x(mi)).attr('y', -20)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 8%, 52%)')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .text(yr);
      }
    });

    // Draw streams
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];

      // Shadow/glow layer
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', vibeHSL[vibe])
        .attr('opacity', 0.15)
        .attr('filter', 'url(#stream-glow)');

      // Main fill
      g.append('path')
        .datum(layer)
        .attr('d', area)
        .attr('fill', `url(#grad-${vibe})`)
        .attr('opacity', 0.75);

      // Edge stroke top
      const lineTop = d3.line<d3.SeriesPoint<typeof series[0]>>()
        .x((_, i) => x(i))
        .y(d => y(d[1]))
        .curve(d3.curveBasis);

      g.append('path')
        .datum(layer)
        .attr('d', lineTop)
        .attr('fill', 'none')
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.5);

      // Edge stroke bottom
      const lineBot = d3.line<d3.SeriesPoint<typeof series[0]>>()
        .x((_, i) => x(i))
        .y(d => y(d[0]))
        .curve(d3.curveBasis);

      g.append('path')
        .datum(layer)
        .attr('d', lineBot)
        .attr('fill', 'none')
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.5);
    });

    // 5-star markers
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];
      layer.forEach((pt, i) => {
        const md = series[i].data;
        if (!md) return;
        const fiveStars = md.books.filter(b => b.vibe === vibe && b.rating === 5);
        if (fiveStars.length === 0) return;
        const midY = (y(pt[0]) + y(pt[1])) / 2;
        
        g.append('circle')
          .attr('cx', x(i))
          .attr('cy', midY)
          .attr('r', 3)
          .attr('fill', 'hsl(43, 90%, 58%)')
          .attr('opacity', 0.6)
          .attr('class', `star-marker star-${i}`);
      });
    });

    // Right-side vibe labels
    const lastIdx = series.length - 1;
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];
      const lastPt = layer[lastIdx];
      const midY = (y(lastPt[0]) + y(lastPt[1])) / 2;
      const labelX = innerW + 20;

      g.append('line')
        .attr('x1', innerW + 3).attr('y1', midY)
        .attr('x2', labelX - 4).attr('y2', midY)
        .attr('stroke', vibeHSL[vibe])
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);

      g.append('text')
        .attr('x', labelX).attr('y', midY + 4)
        .attr('fill', vibeHSL[vibe])
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', "'Source Sans 3', sans-serif")
        .text(vibeLabels[vibe]);
    });

    // Annotations for notable books
    stacked.forEach((layer, li) => {
      const vibe = VIBES[li];
      layer.forEach((pt, i) => {
        const md = series[i].data;
        if (!md) return;
        const annotBooks = md.books.filter(b => b.vibe === vibe && b.annotation);
        if (annotBooks.length === 0) return;

        annotBooks.forEach((book, bi) => {
          const topY = y(pt[1]);
          const annotY = topY - 10 - bi * 12;

          g.append('text')
            .attr('x', x(i))
            .attr('y', annotY)
            .attr('text-anchor', 'middle')
            .attr('fill', 'hsl(200, 8%, 52%)')
            .attr('font-size', '8px')
            .attr('font-style', 'italic')
            .attr('font-family', "'Source Sans 3', sans-serif")
            .attr('opacity', 0.5)
            .text(book.annotation!);
        });
      });
    });

    // Bottom year book counts
    years.forEach(yr => {
      const count = readingData.filter(d => d.year === yr).reduce((a, d) => a + d.books.length, 0);
      const mi = (yr - startYear) * 12 + 6;
      if (mi < series.length) {
        g.append('text')
          .attr('x', x(mi)).attr('y', innerH + 30)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(200, 8%, 52%)')
          .attr('font-size', '11px')
          .attr('font-family', "'Source Sans 3', sans-serif")
          .attr('opacity', 0.4)
          .text(`${count} books`);
      }
    });

    // Hover hitboxes
    const hitboxes = g.append('g').attr('class', 'hitboxes');

    series.forEach((s, i) => {
      const hitbox = hitboxes.append('rect')
        .attr('x', x(i) - (innerW / series.length / 2))
        .attr('y', -10)
        .attr('width', innerW / series.length)
        .attr('height', innerH + 20)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer');

      hitbox.on('mouseenter', () => {
        if (s.data) {
          setHoveredMonth(s.data);
          const rect = svgRef.current!.getBoundingClientRect();
          const px = margin.left + x(i);
          const py = margin.top - 10;
          setTooltipPos({
            x: (px / width) * 100,
            y: (py / height) * 100,
          });
        }

        // Hover line
        g.selectAll('.hover-line').remove();
        g.append('line')
          .attr('class', 'hover-line')
          .attr('x1', x(i)).attr('y1', -5)
          .attr('x2', x(i)).attr('y2', innerH + 5)
          .attr('stroke', 'hsl(180, 10%, 88%)')
          .attr('stroke-width', 1)
          .attr('opacity', 0.2)
          .attr('stroke-dasharray', '3 3');

        // Highlight dots at stream midpoints
        g.selectAll('.hover-dot').remove();
        stacked.forEach((layer, li) => {
          const pt = layer[i];
          const thickness = y(pt[0]) - y(pt[1]);
          if (thickness < 2) return;
          const midY = (y(pt[0]) + y(pt[1])) / 2;
          g.append('circle')
            .attr('class', 'hover-dot')
            .attr('cx', x(i)).attr('cy', midY)
            .attr('r', 3)
            .attr('fill', vibeHSL[VIBES[li]])
            .attr('stroke', 'hsl(180, 10%, 88%)')
            .attr('stroke-width', 0.5);
        });

        // Pulse 5-star markers
        g.selectAll(`.star-${i}`)
          .attr('opacity', 1)
          .attr('r', 5);
      });

      hitbox.on('mouseleave', () => {
        setHoveredMonth(null);
        setTooltipPos(null);
        g.selectAll('.hover-line').remove();
        g.selectAll('.hover-dot').remove();

        // Reset star markers
        g.selectAll(`.star-${i}`)
          .attr('opacity', 0.6)
          .attr('r', 3);
      });
    });

  }, [series, stacked, years]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-2 py-8 overflow-x-auto">
      <header className="text-center mb-6 max-w-3xl px-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-[0.15em] uppercase mb-1">
          RIVER OF READING
        </h1>
        <p className="text-sm text-primary font-light tracking-wide">
          A Navigational Log of Peishan's books — 2021 to present · width = volume · depth of colour = avg rating
        </p>
      </header>

      <div ref={containerRef} className="relative w-full max-w-[1400px]" style={{ minWidth: 900 }}>
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
