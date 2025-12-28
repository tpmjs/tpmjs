'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

interface DataPoint {
  date: Date | string;
  value: number;
  secondaryValue?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  title?: string;
  color?: string;
  secondaryColor?: string;
  showArea?: boolean;
  showSecondary?: boolean;
  labels?: { primary: string; secondary?: string };
  dateFormat?: string;
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
    success: '#22c55e',
    error: '#ef4444',
  };
}

export function AreaChart({
  data,
  width = 500,
  height = 250,
  title,
  color,
  secondaryColor,
  showArea = true,
  showSecondary = false,
  labels,
  dateFormat = '%b %d',
}: AreaChartProps): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const colors = getThemeColors(containerRef.current);
    const lineColor = color || colors.primary;
    const secondLine = secondaryColor || colors.error;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Parse dates
    const parsedData = data.map((d) => ({
      ...d,
      date: typeof d.date === 'string' ? new Date(d.date) : d.date,
    }));

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(parsedData, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const maxY = d3.max(parsedData, (d) => Math.max(d.value, d.secondaryValue || 0)) || 0;

    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([innerHeight, 0]);

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

    // Area generator
    const area = d3
      .area<DataPoint & { date: Date }>()
      .x((d) => x(d.date))
      .y0(innerHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3
      .line<DataPoint & { date: Date }>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const secondaryLine = d3
      .line<DataPoint & { date: Date }>()
      .x((d) => x(d.date))
      .y((d) => y(d.secondaryValue || 0))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0.3);
    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0);

    // Draw area
    if (showArea) {
      const areaPath = g
        .append('path')
        .datum(parsedData)
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area);

      // Animate area
      const totalLength = areaPath.node()?.getTotalLength() || 0;
      areaPath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1200)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    }

    // Draw primary line
    const linePath = g
      .append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', lineColor)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animate line
    const lineLength = linePath.node()?.getTotalLength() || 0;
    linePath
      .attr('stroke-dasharray', `${lineLength} ${lineLength}`)
      .attr('stroke-dashoffset', lineLength)
      .transition()
      .duration(1200)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0);

    // Draw secondary line
    if (showSecondary) {
      const secondPath = g
        .append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', secondLine)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,3')
        .attr('d', secondaryLine);

      const secondLength = secondPath.node()?.getTotalLength() || 0;
      secondPath
        .attr('stroke-dasharray', `${secondLength} ${secondLength}`)
        .attr('stroke-dashoffset', secondLength)
        .transition()
        .duration(1200)
        .delay(200)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    }

    // Draw dots
    g.selectAll('.dot')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(d.date))
      .attr('cy', (d) => y(d.value))
      .attr('r', 0)
      .attr('fill', lineColor)
      .attr('stroke', colors.background)
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        setHoveredPoint(d);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }
        d3.select(this).transition().duration(150).attr('r', 6);
      })
      .on('mouseleave', function () {
        setHoveredPoint(null);
        d3.select(this).transition().duration(150).attr('r', 4);
      })
      .transition()
      .duration(400)
      .delay((_, i) => 1000 + i * 50)
      .attr('r', 4);

    // X axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(Math.min(data.length, 7))
          .tickFormat((d) => d3.timeFormat(dateFormat)(d as Date))
      )
      .call((g) => g.select('.domain').attr('stroke', colors.border))
      .call((g) => g.selectAll('.tick line').attr('stroke', colors.border))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', colors.foregroundTertiary)
          .style('font-size', '0.7rem')
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
  }, [data, width, height, color, secondaryColor, showArea, showSecondary, dateFormat]);

  const themeColors = containerRef.current ? getThemeColors(containerRef.current) : null;

  return (
    <div ref={containerRef} className="relative">
      {title && <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>}
      {labels && (
        <div className="flex gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: color || themeColors?.primary }}
            />
            <span className="text-foreground-secondary">{labels.primary}</span>
          </div>
          {showSecondary && labels.secondary && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 rounded"
                style={{
                  backgroundColor: secondaryColor || themeColors?.error,
                  borderStyle: 'dashed',
                }}
              />
              <span className="text-foreground-secondary">{labels.secondary}</span>
            </div>
          )}
        </div>
      )}
      <svg ref={svgRef} />
      {hoveredPoint && (
        <div
          className="absolute px-3 py-2 bg-surface border border-border rounded-lg shadow-lg text-sm z-10 pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 10, width - 150),
            top: mousePos.y - 60,
          }}
        >
          <div className="text-xs text-foreground-tertiary mb-1">
            {typeof hoveredPoint.date === 'string'
              ? hoveredPoint.date
              : d3.timeFormat('%b %d, %Y')(hoveredPoint.date as Date)}
          </div>
          <div className="font-medium text-foreground">{hoveredPoint.value.toLocaleString()}</div>
          {showSecondary && hoveredPoint.secondaryValue !== undefined && (
            <div className="text-error text-xs mt-0.5">
              {hoveredPoint.secondaryValue.toLocaleString()} errors
            </div>
          )}
        </div>
      )}
    </div>
  );
}
