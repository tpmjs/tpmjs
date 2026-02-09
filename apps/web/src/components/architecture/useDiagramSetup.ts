'use client';

import * as d3 from 'd3';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiagramDimensions, ThemeColors } from './types';
import { darkColors, lightColors } from './types';

interface UseDiagramSetupOptions {
  defaultWidth?: number;
  defaultHeight?: number;
  minHeight?: number;
}

export function useDiagramSetup(options: UseDiagramSetupOptions = {}) {
  const { defaultWidth = 500, defaultHeight = 300, minHeight = 200 } = options;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<DiagramDimensions>({
    width: defaultWidth,
    height: defaultHeight,
  });
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Handle mounting
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.max(minHeight, defaultHeight);
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [defaultHeight, minHeight]);

  const isDark = resolvedTheme === 'dark';
  const colors: ThemeColors = isDark ? darkColors : lightColors;

  // Show tooltip
  const showTooltip = useCallback((event: MouseEvent, title: string, description: string) => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.innerHTML = `
        <div class="font-semibold text-sm text-foreground mb-1">${title}</div>
        <div class="text-xs text-foreground-secondary">${description}</div>
      `;
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';

    // Position tooltip
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      tooltip.style.left = `${x + 10}px`;
      tooltip.style.top = `${y - 10}px`;
    }
  }, []);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    if (!tooltipRef.current) return;
    tooltipRef.current.style.opacity = '0';
    tooltipRef.current.style.visibility = 'hidden';
  }, []);

  // Setup SVG with common definitions (filters, markers)
  const setupSvg = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      svg.selectAll('*').remove();

      const defs = svg.append('defs');

      // Drop shadow filter
      const shadow = defs
        .append('filter')
        .attr('id', 'section-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      shadow
        .append('feDropShadow')
        .attr('dx', '0')
        .attr('dy', '2')
        .attr('stdDeviation', '3')
        .attr('flood-color', isDark ? '#000' : '#000')
        .attr('flood-opacity', isDark ? '0.3' : '0.1');

      // Glow filter for hover
      const glow = defs
        .append('filter')
        .attr('id', 'section-glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
      const glowMerge = glow.append('feMerge');
      glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
      glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // Arrow marker
      defs
        .append('marker')
        .attr('id', 'section-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 5)
        .attr('markerHeight', 5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', isDark ? '#666' : '#999');

      // Gradient definitions for visual interest
      const gradientPrimary = defs
        .append('linearGradient')
        .attr('id', 'gradient-primary')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      gradientPrimary
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colors.primary?.fill ?? '#e3f2fd');
      gradientPrimary
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', isDark ? '#2a4a7f' : '#bbdefb');

      return svg.append('g').attr('class', 'main-group');
    },
    [isDark, colors]
  );

  // Draw animated connection line
  const drawConnection = useCallback(
    (
      group: d3.Selection<SVGGElement, unknown, null, undefined>,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      options: {
        label?: string;
        animated?: boolean;
        dashed?: boolean;
        curved?: boolean;
        delay?: number;
      } = {}
    ) => {
      const { label, animated = true, dashed = false, curved = false, delay = 0 } = options;

      let pathData: string;
      if (curved) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const ctrlY = midY - Math.abs(x2 - x1) * 0.3;
        pathData = `M ${x1} ${y1} Q ${midX} ${ctrlY}, ${x2} ${y2}`;
      } else {
        pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
      }

      // Background path
      group
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isDark ? '#333' : '#e5e5e5')
        .attr('stroke-width', 2);

      // Animated path
      const path = group
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', isDark ? '#555' : '#aaa')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#section-arrow)');

      if (dashed) {
        path.attr('stroke-dasharray', '6,4');
      }

      // Animate the path drawing
      const pathNode = path.node();
      if (pathNode && animated) {
        const pathLength = pathNode.getTotalLength();
        path
          .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
          .attr('stroke-dashoffset', pathLength)
          .transition()
          .delay(delay)
          .duration(600)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0)
          .on('end', () => {
            if (dashed) {
              path.attr('stroke-dasharray', '6,4').attr('stroke-dashoffset', 0);
              // Start flow animation
              const animateFlow = () => {
                path
                  .transition()
                  .duration(1000)
                  .ease(d3.easeLinear)
                  .attr('stroke-dashoffset', -20)
                  .on('end', () => {
                    path.attr('stroke-dashoffset', 0);
                    animateFlow();
                  });
              };
              animateFlow();
            }
          });
      }

      // Label
      if (label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        group
          .append('text')
          .attr('x', midX)
          .attr('y', midY - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', isDark ? '#888' : '#666')
          .attr('font-size', '10px')
          .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
          .attr('opacity', 0)
          .text(label)
          .transition()
          .delay(delay + 300)
          .duration(300)
          .attr('opacity', 1);
      }
    },
    [isDark]
  );

  // Draw a node box
  const drawNode = useCallback(
    (
      group: d3.Selection<SVGGElement, unknown, null, undefined>,
      x: number,
      y: number,
      width: number,
      height: number,
      options: {
        label: string;
        sublabel?: string;
        type?: string;
        tooltip?: { title: string; description: string };
        delay?: number;
        icon?: string;
      }
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: canvas drawing with many options
    ) => {
      const { label, sublabel, type = 'neutral', tooltip, delay = 0, icon } = options;
      const color = colors[type as keyof ThemeColors] ??
        colors.neutral ?? {
          fill: '#f5f5f5',
          stroke: '#9e9e9e',
          text: '#424242',
        };

      const nodeGroup = group
        .append('g')
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', tooltip ? 'pointer' : 'default');

      // Main rectangle
      const rect = nodeGroup
        .append('rect')
        .attr('class', 'node-rect')
        .attr('x', -width / 2)
        .attr('y', -height / 2)
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 8)
        .attr('fill', color.fill)
        .attr('stroke', color.stroke)
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#section-shadow)');

      // Hover effects
      if (tooltip) {
        nodeGroup
          .on('mouseenter', (event) => {
            rect
              .transition()
              .duration(150)
              .attr('stroke-width', 2.5)
              .attr('filter', 'url(#section-glow)');
            showTooltip(event as MouseEvent, tooltip.title, tooltip.description);
          })
          .on('mousemove', (event) => {
            showTooltip(event as MouseEvent, tooltip.title, tooltip.description);
          })
          .on('mouseleave', () => {
            rect
              .transition()
              .duration(150)
              .attr('stroke-width', 1.5)
              .attr('filter', 'url(#section-shadow)');
            hideTooltip();
          });
      }

      // Icon (if provided)
      if (icon) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', sublabel ? -height / 2 + 20 : -4)
          .attr('text-anchor', 'middle')
          .attr('font-size', '16px')
          .text(icon);
      }

      // Label
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', sublabel ? (icon ? 0 : -6) : 4)
        .attr('text-anchor', 'middle')
        .attr('fill', color.text)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .text(label);

      // Sublabel
      if (sublabel) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', icon ? 16 : 10)
          .attr('text-anchor', 'middle')
          .attr('fill', color.text)
          .attr('font-size', '10px')
          .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
          .attr('opacity', 0.7)
          .text(sublabel);
      }

      // Entrance animation
      nodeGroup
        .attr('opacity', 0)
        .attr('transform', `translate(${x}, ${y - 10})`)
        .transition()
        .delay(delay)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', `translate(${x}, ${y})`);

      return nodeGroup;
    },
    [colors, showTooltip, hideTooltip]
  );

  return {
    svgRef,
    containerRef,
    tooltipRef,
    dimensions,
    mounted,
    isDark,
    colors,
    setupSvg,
    drawConnection,
    drawNode,
    showTooltip,
    hideTooltip,
  };
}
