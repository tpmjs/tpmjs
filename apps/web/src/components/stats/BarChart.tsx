'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  title?: string;
  horizontal?: boolean;
  color?: string;
  showValues?: boolean;
}

function getThemeColors(element: HTMLElement) {
  const styles = getComputedStyle(element);
  return {
    background: styles.getPropertyValue('--color-background').trim() || '#ffffff',
    foreground: styles.getPropertyValue('--color-foreground').trim() || '#0a0a0a',
    foregroundSecondary:
      styles.getPropertyValue('--color-foreground-secondary').trim() || '#525252',
    foregroundTertiary: styles.getPropertyValue('--color-foreground-tertiary').trim() || '#737373',
    border: styles.getPropertyValue('--color-border').trim() || '#e5e5e5',
    primary: styles.getPropertyValue('--color-primary').trim() || '#2563eb',
  };
}

export function BarChart({
  data,
  width = 400,
  height = 300,
  title,
  horizontal = false,
  color,
  showValues = true,
}: BarChartProps): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const colors = getThemeColors(containerRef.current);
    const barColor = color || colors.primary;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = horizontal
      ? { top: 20, right: 40, bottom: 20, left: 100 }
      : { top: 20, right: 20, bottom: 60, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const maxValue = d3.max(data, (d) => d.value) || 0;

    if (horizontal) {
      // Horizontal bar chart
      const y = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerHeight])
        .padding(0.3);

      const x = d3.scaleLinear().domain([0, maxValue]).range([0, innerWidth]);

      // Bars
      g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', (d) => y(d.label) || 0)
        .attr('height', y.bandwidth())
        .attr('fill', barColor)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .style('opacity', 0.85)
        .on('mouseenter', function (_, d) {
          setHoveredBar(d.label);
          d3.select(this).transition().duration(150).style('opacity', 1);
        })
        .on('mouseleave', function () {
          setHoveredBar(null);
          d3.select(this).transition().duration(150).style('opacity', 0.85);
        })
        .attr('x', 0)
        .attr('width', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .ease(d3.easeElasticOut.amplitude(1).period(0.5))
        .attr('width', (d) => x(d.value));

      // Labels
      g.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'label')
        .attr('x', -8)
        .attr('y', (d) => (y(d.label) || 0) + y.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', colors.foregroundSecondary)
        .style('font-size', '0.75rem')
        .text((d) => (d.label.length > 12 ? d.label.slice(0, 12) + '...' : d.label));

      // Values
      if (showValues) {
        g.selectAll('.value')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'value')
          .attr('x', (d) => x(d.value) + 6)
          .attr('y', (d) => (y(d.label) || 0) + y.bandwidth() / 2)
          .attr('dominant-baseline', 'middle')
          .attr('fill', colors.foregroundTertiary)
          .style('font-size', '0.7rem')
          .style('opacity', 0)
          .text((d) => d.value.toLocaleString())
          .transition()
          .duration(400)
          .delay((_, i) => 600 + i * 50)
          .style('opacity', 1);
      }
    } else {
      // Vertical bar chart
      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerWidth])
        .padding(0.3);

      const y = d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0]);

      // Grid lines
      g.selectAll('.grid-line')
        .data(y.ticks(5))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', (d) => y(d))
        .attr('y2', (d) => y(d))
        .attr('stroke', colors.border)
        .attr('stroke-dasharray', '3,3')
        .style('opacity', 0.5);

      // Bars
      g.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.label) || 0)
        .attr('width', x.bandwidth())
        .attr('fill', barColor)
        .attr('rx', 4)
        .style('cursor', 'pointer')
        .style('opacity', 0.85)
        .on('mouseenter', function (_, d) {
          setHoveredBar(d.label);
          d3.select(this).transition().duration(150).style('opacity', 1);
        })
        .on('mouseleave', function () {
          setHoveredBar(null);
          d3.select(this).transition().duration(150).style('opacity', 0.85);
        })
        .attr('y', innerHeight)
        .attr('height', 0)
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .ease(d3.easeElasticOut.amplitude(1).period(0.5))
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => innerHeight - y(d.value));

      // X axis labels
      g.selectAll('.x-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', (d) => (x(d.label) || 0) + x.bandwidth() / 2)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.foregroundSecondary)
        .style('font-size', '0.7rem')
        .text((d) => (d.label.length > 8 ? d.label.slice(0, 8) + '...' : d.label))
        .attr(
          'transform',
          (d) => `rotate(-45, ${(x(d.label) || 0) + x.bandwidth() / 2}, ${innerHeight + 20})`
        );

      // Y axis
      g.append('g')
        .call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickFormat((d) => d.toLocaleString())
        )
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').remove())
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', colors.foregroundTertiary)
            .style('font-size', '0.7rem')
        );
    }
  }, [data, width, height, horizontal, color, showValues]);

  const hoveredData = data.find((d) => d.label === hoveredBar);

  return (
    <div ref={containerRef} className="relative">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      <svg ref={svgRef} />
      {hoveredData && (
        <div className="absolute top-2 right-2 px-3 py-1.5 bg-surface border border-border rounded-lg shadow-lg text-sm z-10">
          <span className="font-medium text-foreground">{hoveredData.label}:</span>{' '}
          <span className="text-foreground-secondary">{hoveredData.value.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
