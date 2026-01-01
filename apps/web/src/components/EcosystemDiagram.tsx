'use client';

import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'blocksai' | 'tpmjs' | 'hllm' | 'flow';
}

interface Connection {
  from: string;
  to: string;
  label: string;
  animated?: boolean;
}

const nodeDescriptions: Record<string, { title: string; description: string }> = {
  blocksai: {
    title: 'BlocksAI',
    description:
      'Domain-driven validation framework. 3,200+ line blocks.yml defines 9 principles, 25+ domain rules, and quality measures for all tools.',
  },
  tools: {
    title: '106 Official Tools',
    description:
      'Research, web scraping, data processing, documents, engineering, security, statistics, operations, agents, utilities, HTML.',
  },
  registry: {
    title: 'TPMJS Registry',
    description:
      'Central registry at tpmjs.com. Tools auto-discovered from npm, indexed with quality scores and health status.',
  },
  executor: {
    title: 'TPMJS Executor',
    description:
      'Deno sandbox on Railway. Tools loaded from esm.sh, executed securely with user API keys injected.',
  },
  hllm: {
    title: 'HLLM Platform',
    description:
      'Multi-agent orchestration at hllm.dev. 13 topology patterns, 100+ AI models, real-time visualization.',
  },
  browser: {
    title: 'Tool Browser',
    description:
      'In-app tool selector. Users search/filter by category, one-click add to agents, full schema sync.',
  },
  agents: {
    title: 'Agent Execution',
    description:
      'Agents use tools during topology runs. Calls routed to TPMJS executor, results streamed back.',
  },
};

export function EcosystemDiagram(): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    description: string;
  }>({ visible: false, x: 0, y: 0, title: '', description: '' });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.min(500, Math.max(400, width * 0.5));
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const isMobile = width < 600;

    // Define nodes - horizontal flow
    const nodes: Node[] = isMobile
      ? [
          // Mobile: vertical layout
          {
            id: 'blocksai',
            label: 'BlocksAI',
            sublabel: 'Validates',
            x: width / 2,
            y: 60,
            width: 140,
            height: 50,
            type: 'blocksai',
          },
          {
            id: 'tools',
            label: '106 Tools',
            sublabel: '11 categories',
            x: width / 2,
            y: 140,
            width: 140,
            height: 50,
            type: 'flow',
          },
          {
            id: 'registry',
            label: 'TPMJS',
            sublabel: 'Registry',
            x: width / 2,
            y: 220,
            width: 140,
            height: 50,
            type: 'tpmjs',
          },
          {
            id: 'executor',
            label: 'Executor',
            sublabel: 'Deno sandbox',
            x: width / 2,
            y: 300,
            width: 140,
            height: 50,
            type: 'tpmjs',
          },
          {
            id: 'hllm',
            label: 'HLLM',
            sublabel: 'Users',
            x: width / 2,
            y: 380,
            width: 140,
            height: 50,
            type: 'hllm',
          },
        ]
      : [
          // Desktop: horizontal flow
          {
            id: 'blocksai',
            label: 'BlocksAI',
            sublabel: 'Validates quality',
            x: 100,
            y: height / 2,
            width: 130,
            height: 60,
            type: 'blocksai',
          },
          {
            id: 'tools',
            label: '106 Tools',
            sublabel: '11 categories',
            x: 260,
            y: height / 2,
            width: 120,
            height: 60,
            type: 'flow',
          },
          {
            id: 'registry',
            label: 'TPMJS',
            sublabel: 'Registry',
            x: 420,
            y: height / 2 - 50,
            width: 120,
            height: 50,
            type: 'tpmjs',
          },
          {
            id: 'executor',
            label: 'Executor',
            sublabel: 'Deno sandbox',
            x: 420,
            y: height / 2 + 50,
            width: 120,
            height: 50,
            type: 'tpmjs',
          },
          {
            id: 'browser',
            label: 'Tool Browser',
            sublabel: 'Search & add',
            x: 580,
            y: height / 2 - 50,
            width: 120,
            height: 50,
            type: 'hllm',
          },
          {
            id: 'agents',
            label: 'Agents',
            sublabel: 'Execute tools',
            x: 580,
            y: height / 2 + 50,
            width: 120,
            height: 50,
            type: 'hllm',
          },
          {
            id: 'hllm',
            label: 'HLLM',
            sublabel: 'hllm.dev',
            x: 720,
            y: height / 2,
            width: 100,
            height: 60,
            type: 'hllm',
          },
        ];

    // Define connections
    const connections: Connection[] = isMobile
      ? [
          { from: 'blocksai', to: 'tools', label: 'validates' },
          { from: 'tools', to: 'registry', label: 'published to' },
          { from: 'registry', to: 'executor', label: 'loads' },
          { from: 'executor', to: 'hllm', label: 'executes for', animated: true },
        ]
      : [
          { from: 'blocksai', to: 'tools', label: 'validates' },
          { from: 'tools', to: 'registry', label: 'published' },
          { from: 'tools', to: 'executor', label: 'runs in' },
          { from: 'registry', to: 'browser', label: 'browse', animated: true },
          { from: 'executor', to: 'agents', label: 'execute', animated: true },
          { from: 'browser', to: 'hllm', label: '' },
          { from: 'agents', to: 'hllm', label: '' },
        ];

    // Colors
    type ColorScheme = { fill: string; stroke: string; text: string };
    const colors: {
      blocksai: ColorScheme;
      tpmjs: ColorScheme;
      hllm: ColorScheme;
      flow: ColorScheme;
    } = {
      blocksai: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
      tpmjs: { fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
      hllm: { fill: '#ede9fe', stroke: '#8b5cf6', text: '#5b21b6' },
      flow: { fill: '#f3f4f6', stroke: '#6b7280', text: '#374151' },
    };

    // Draw connections first (behind nodes)
    const connectionGroup = svg.append('g').attr('class', 'connections');

    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);
      if (!fromNode || !toNode) return;

      // Calculate connection points based on layout
      const getConnectionPoints = () => {
        if (isMobile) {
          // Vertical connections
          return {
            x1: fromNode.x,
            y1: fromNode.y + fromNode.height / 2,
            x2: toNode.x,
            y2: toNode.y - toNode.height / 2,
          };
        }
        // Horizontal connections - find best edge
        const fromRight = fromNode.x + fromNode.width / 2;
        const fromBottom = fromNode.y + fromNode.height / 2;
        const toLeft = toNode.x - toNode.width / 2;
        const toTop = toNode.y - toNode.height / 2;

        if (Math.abs(fromNode.y - toNode.y) < 20) {
          // Same row - connect horizontally
          return { x1: fromRight, y1: fromNode.y, x2: toLeft, y2: toNode.y };
        }
        if (toNode.x > fromNode.x) {
          // Going right and up/down
          return { x1: fromRight, y1: fromNode.y, x2: toLeft, y2: toNode.y };
        }
        // Same column - connect vertically
        return { x1: fromNode.x, y1: fromBottom, x2: toNode.x, y2: toTop };
      };

      const { x1, y1, x2, y2 } = getConnectionPoints();

      // Draw line
      const line = connectionGroup
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)');

      if (conn.animated) {
        line.attr('stroke-dasharray', '5,5');

        // Animate
        const animateDash = () => {
          line
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(1000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', -10)
            .on('end', animateDash);
        };
        animateDash();
      }

      // Add label
      if (conn.label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        connectionGroup
          .append('text')
          .attr('x', midX)
          .attr('y', midY - 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#64748b')
          .text(conn.label);
      }
    });

    // Define arrowhead marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    nodes.forEach((node) => {
      const color = colors[node.type] || colors.flow;
      const g = nodeGroup.append('g').attr('class', 'node').style('cursor', 'pointer');

      // Node rectangle
      g.append('rect')
        .attr('x', node.x - node.width / 2)
        .attr('y', node.y - node.height / 2)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', color.fill)
        .attr('stroke', color.stroke)
        .attr('stroke-width', 2);

      // Main label
      g.append('text')
        .attr('x', node.x)
        .attr('y', node.sublabel ? node.y - 4 : node.y + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', isMobile ? '12px' : '13px')
        .attr('font-weight', '600')
        .attr('fill', color.text)
        .text(node.label);

      // Sublabel
      if (node.sublabel) {
        g.append('text')
          .attr('x', node.x)
          .attr('y', node.y + 12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', color.text)
          .attr('opacity', 0.7)
          .text(node.sublabel);
      }

      // Hover events
      g.on('mouseenter', (event) => {
        const desc = nodeDescriptions[node.id];
        if (desc) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltip({
              visible: true,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top - 10,
              title: desc.title,
              description: desc.description,
            });
          }
        }
      }).on('mouseleave', () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });
    });

    // Add legend
    const legend = svg.append('g').attr('transform', `translate(${width - 160}, 20)`);

    const legendItems = [
      { label: 'BlocksAI', color: colors.blocksai },
      { label: 'TPMJS', color: colors.tpmjs },
      { label: 'HLLM', color: colors.hllm },
    ];

    legendItems.forEach((item, i) => {
      const y = i * 22;
      legend
        .append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', 14)
        .attr('height', 14)
        .attr('rx', 3)
        .attr('fill', item.color.fill)
        .attr('stroke', item.color.stroke)
        .attr('stroke-width', 1.5);

      legend
        .append('text')
        .attr('x', 20)
        .attr('y', y + 11)
        .attr('font-size', '11px')
        .attr('fill', '#64748b')
        .text(item.label);
    });
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ minHeight: '400px' }}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute z-10 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold text-sm text-foreground">{tooltip.title}</div>
          <div className="text-xs text-foreground-secondary mt-1">{tooltip.description}</div>
        </div>
      )}
    </div>
  );
}
