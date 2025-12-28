'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  innerRadius?: number;
  title?: string;
  centerValue?: string | number;
  centerLabel?: string;
}

function getThemeColors(element: HTMLElement) {
  const styles = getComputedStyle(element);
  return {
    background: styles.getPropertyValue('--color-background').trim() || '#ffffff',
    foreground: styles.getPropertyValue('--color-foreground').trim() || '#0a0a0a',
    foregroundSecondary:
      styles.getPropertyValue('--color-foreground-secondary').trim() || '#525252',
  };
}

export function DonutChart({
  data,
  size = 200,
  innerRadius = 0.6,
  title,
  centerValue,
  centerLabel,
}: DonutChartProps): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const colors = getThemeColors(containerRef.current);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = size / 2;
    const innerR = radius * innerRadius;

    const g = svg
      .attr('width', size)
      .attr('height', size)
      .append('g')
      .attr('transform', `translate(${radius}, ${radius})`);

    const pie = d3
      .pie<{ label: string; value: number; color: string }>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(innerR)
      .outerRadius(radius - 10);

    const hoverArc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
      .innerRadius(innerR)
      .outerRadius(radius - 5);

    const arcs = pie(data);

    // Draw slices with animation
    g.selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', colors.background)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseenter', function (_, d) {
        setHoveredSlice(d.data.label);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', hoverArc as unknown as string)
          .style('opacity', 1);
      })
      .on('mouseleave', function () {
        setHoveredSlice(null);
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc as unknown as string)
          .style('opacity', 0.9);
      })
      .transition()
      .duration(800)
      .attrTween('d', (d) => {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(interpolate(t)) || '';
      });

    // Center text
    if (centerValue !== undefined) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('dy', centerLabel ? '-0.3em' : '0')
        .attr('fill', colors.foreground)
        .style('font-size', '1.5rem')
        .style('font-weight', 'bold')
        .text(String(centerValue));

      if (centerLabel) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('dy', '1.2em')
          .attr('fill', colors.foregroundSecondary)
          .style('font-size', '0.75rem')
          .text(centerLabel);
      }
    }
  }, [data, size, innerRadius, centerValue, centerLabel]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hoveredData = data.find((d) => d.label === hoveredSlice);

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <div className="relative">
        <svg ref={svgRef} />
        {hoveredData && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-surface border border-border rounded-lg shadow-lg text-sm whitespace-nowrap z-10">
            <span className="font-medium text-foreground">{hoveredData.label}:</span>{' '}
            <span className="text-foreground-secondary">
              {hoveredData.value.toLocaleString()} ({((hoveredData.value / total) * 100).toFixed(1)}
              %)
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {data.map((d) => (
          <div
            key={d.label}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              hoveredSlice && hoveredSlice !== d.label ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-foreground-secondary">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
