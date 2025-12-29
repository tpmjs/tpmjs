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
  type: 'source' | 'process' | 'storage' | 'api' | 'output';
}

interface Connection {
  from: string;
  to: string;
  animated?: boolean;
}

const nodeDescriptions: Record<string, { title: string; description: string }> = {
  npm: {
    title: 'NPM Registry',
    description:
      'The public npm registry containing all JavaScript packages. TPMJS monitors packages with the tpmjs keyword.',
  },
  'changes-feed': {
    title: 'Changes Feed',
    description:
      "Real-time monitoring of npm's _changes endpoint. Catches new packages and updates within 2 minutes of publication.",
  },
  'keyword-search': {
    title: 'Keyword Search',
    description:
      'Periodic search for packages with the tpmjs keyword. Acts as a backup to ensure no packages are missed.',
  },
  validation: {
    title: 'Schema Validation',
    description:
      'Validates the tpmjs field in package.json against the TPMJS specification. Invalid packages are rejected.',
  },
  database: {
    title: 'PostgreSQL Database',
    description:
      'Stores tool metadata, health check results, sync logs, and quality scores. Hosted on Neon with connection pooling.',
  },
  'health-checks': {
    title: 'Health Checks',
    description:
      'Verifies tools can be imported and executed. Checks for missing dependencies, runtime errors, and schema compliance.',
  },
  metrics: {
    title: 'Metrics & Quality Score',
    description:
      'Hourly sync of npm download stats. Quality score calculated from tier (rich/minimal), downloads, and GitHub stars.',
  },
  'search-api': {
    title: 'Search API',
    description:
      'REST endpoint for searching tools by keyword, category, or description. Returns paginated results with metadata.',
  },
  'execute-api': {
    title: 'Execution API',
    description:
      'Executes tools in a sandboxed Deno runtime. API keys passed per-request, never stored. Results returned directly.',
  },
  frontend: {
    title: 'Frontend UI',
    description:
      'Next.js application at tpmjs.com. Browse tools, view details, test in the playground, and read documentation.',
  },
};

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

export function ArchitectureDiagram(): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth, 900);
        setDimensions({ width, height: 620 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Get computed theme colors
    const colors = getThemeColors(containerRef.current);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width } = dimensions;
    const centerX = width / 2;
    const scale = Math.min(1, width / 800);

    const nodes: Node[] = [
      // Top: NPM Registry
      {
        id: 'npm',
        label: 'NPM Registry',
        sublabel: 'registry.npmjs.org',
        x: centerX,
        y: 50,
        width: 200 * scale,
        height: 55,
        type: 'source',
      },
      // Discovery sources
      {
        id: 'changes-feed',
        label: 'Changes Feed',
        sublabel: 'Every 2 min',
        x: centerX - 150 * scale,
        y: 150,
        width: 140 * scale,
        height: 55,
        type: 'process',
      },
      {
        id: 'keyword-search',
        label: 'Keyword Search',
        sublabel: 'Every 15 min',
        x: centerX + 150 * scale,
        y: 150,
        width: 150 * scale,
        height: 55,
        type: 'process',
      },
      // Validation
      {
        id: 'validation',
        label: 'Schema Validation',
        sublabel: 'Zod + TPMJS Spec',
        x: centerX,
        y: 250,
        width: 180 * scale,
        height: 55,
        type: 'process',
      },
      // Storage & Health
      {
        id: 'database',
        label: 'PostgreSQL',
        sublabel: 'Neon',
        x: centerX - 130 * scale,
        y: 350,
        width: 130 * scale,
        height: 55,
        type: 'storage',
      },
      {
        id: 'health-checks',
        label: 'Health Checks',
        sublabel: 'Import + Execute',
        x: centerX + 130 * scale,
        y: 350,
        width: 145 * scale,
        height: 55,
        type: 'process',
      },
      // Metrics
      {
        id: 'metrics',
        label: 'Quality Score',
        sublabel: 'Hourly sync',
        x: centerX,
        y: 450,
        width: 150 * scale,
        height: 55,
        type: 'process',
      },
      // APIs
      {
        id: 'search-api',
        label: 'Search API',
        sublabel: '/api/tools',
        x: centerX - 120 * scale,
        y: 530,
        width: 120 * scale,
        height: 50,
        type: 'api',
      },
      {
        id: 'execute-api',
        label: 'Execute API',
        sublabel: '/api/execute',
        x: centerX + 120 * scale,
        y: 530,
        width: 130 * scale,
        height: 50,
        type: 'api',
      },
      // Frontend
      {
        id: 'frontend',
        label: 'tpmjs.com',
        sublabel: 'Search · Browse · Playground',
        x: centerX,
        y: 590,
        width: 220 * scale,
        height: 40,
        type: 'output',
      },
    ];

    const connections: Connection[] = [
      { from: 'npm', to: 'changes-feed', animated: true },
      { from: 'npm', to: 'keyword-search', animated: true },
      { from: 'changes-feed', to: 'validation', animated: true },
      { from: 'keyword-search', to: 'validation', animated: true },
      { from: 'validation', to: 'database', animated: true },
      { from: 'validation', to: 'health-checks', animated: true },
      { from: 'database', to: 'metrics', animated: true },
      { from: 'health-checks', to: 'metrics', animated: true },
      { from: 'metrics', to: 'search-api', animated: true },
      { from: 'metrics', to: 'execute-api', animated: true },
      { from: 'search-api', to: 'frontend', animated: true },
      { from: 'execute-api', to: 'frontend', animated: true },
    ];

    // Create defs
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs
      .append('filter')
      .attr('id', 'arch-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Shadow filter
    const shadow = defs
      .append('filter')
      .attr('id', 'arch-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadow
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '4')
      .attr('flood-color', colors.foreground)
      .attr('flood-opacity', '0.1');

    // Arrow marker
    defs
      .append('marker')
      .attr('id', 'arch-arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', colors.foregroundTertiary);

    const mainGroup = svg.append('g');

    // Draw connections with animated flow
    connections.forEach((conn, i) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const startY = fromNode.y + fromNode.height / 2;
      const endY = toNode.y - toNode.height / 2;
      const midY = (startY + endY) / 2;

      const pathData = `M ${fromNode.x} ${startY}
                        C ${fromNode.x} ${midY},
                          ${toNode.x} ${midY},
                          ${toNode.x} ${endY - 8}`;

      // Background path
      mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', colors.border)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.5);

      // Animated path
      const animatedPath = mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', colors.foregroundTertiary)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,10')
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#arch-arrowhead)');

      // Animate the dash offset
      if (conn.animated) {
        const animate = () => {
          animatedPath
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', -32)
            .on('end', animate);
        };
        animate();
      }

      // Flowing particle
      const particle = mainGroup
        .append('circle')
        .attr('r', 3)
        .attr('fill', colors.primary)
        .attr('opacity', 0)
        .attr('filter', 'url(#arch-glow)');

      const animateParticle = () => {
        const pathNode = animatedPath.node();
        if (!pathNode) return;
        const pathLength = (pathNode as SVGPathElement).getTotalLength();

        particle
          .attr('opacity', 0.9)
          .transition()
          .duration(1500 + Math.random() * 500)
          .ease(d3.easeQuadInOut)
          .attrTween('transform', () => {
            return (t: number) => {
              const point = (pathNode as SVGPathElement).getPointAtLength(t * pathLength);
              return `translate(${point.x}, ${point.y})`;
            };
          })
          .attr('opacity', 0)
          .on('end', () => {
            setTimeout(animateParticle, Math.random() * 2000 + 1000);
          });
      };
      setTimeout(animateParticle, i * 200 + Math.random() * 1000);
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const nodeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          setHoveredNode(node.id);
          d3.select(this).select('.main-rect').transition().duration(200).attr('stroke-width', 2.5);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0.25);
        })
        .on('mouseleave', function () {
          setHoveredNode(null);
          d3.select(this).select('.main-rect').transition().duration(200).attr('stroke-width', 1.5);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0);
        });

      // Glow effect on hover
      nodeGroup
        .append('rect')
        .attr('class', 'node-glow')
        .attr('x', -node.width / 2 - 4)
        .attr('y', -node.height / 2 - 4)
        .attr('width', node.width + 8)
        .attr('height', node.height + 8)
        .attr('rx', 10)
        .attr('fill', colors.primary)
        .attr('opacity', 0)
        .attr('filter', 'url(#arch-glow)');

      // Determine colors based on type
      let strokeColor = colors.border;
      let fillColor = colors.background;
      let textColor = colors.foreground;
      let sublabelColor = colors.foregroundTertiary;

      if (node.type === 'source') {
        strokeColor = colors.foreground;
      } else if (node.type === 'process') {
        strokeColor = colors.primary;
      } else if (node.type === 'storage') {
        strokeColor = colors.foreground;
      } else if (node.type === 'api') {
        strokeColor = colors.foregroundSecondary;
      } else if (node.type === 'output') {
        strokeColor = colors.foreground;
        fillColor = colors.foreground;
        textColor = colors.background;
        sublabelColor = colors.background;
      }

      // Main rectangle
      nodeGroup
        .append('rect')
        .attr('class', 'main-rect')
        .attr('x', -node.width / 2)
        .attr('y', -node.height / 2)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('rx', node.type === 'output' ? 4 : 8)
        .attr('fill', fillColor)
        .attr('stroke', strokeColor)
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#arch-shadow)');

      // Label
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', node.sublabel ? -4 : 4)
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-monospace, monospace')
        .text(node.label);

      // Sublabel
      if (node.sublabel) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', 14)
          .attr('text-anchor', 'middle')
          .attr('fill', sublabelColor)
          .attr('font-size', '10px')
          .attr('font-family', 'ui-monospace, monospace')
          .attr('opacity', node.type === 'output' ? 0.7 : 0.8)
          .text(node.sublabel);
      }

      // Entrance animation
      nodeGroup
        .attr('opacity', 0)
        .attr('transform', `translate(${node.x}, ${node.y - 15})`)
        .transition()
        .delay(100 + i * 60)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', `translate(${node.x}, ${node.y})`);
    });
  }, [dimensions]);

  const hoveredInfo = hoveredNode ? nodeDescriptions[hoveredNode] : null;

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative p-4 md:p-6 border border-border rounded-xl bg-surface/50 backdrop-blur overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="mx-auto relative"
          style={{ maxWidth: '100%', height: 'auto' }}
          role="img"
          aria-label="TPMJS System Architecture diagram"
        />
      </div>

      {/* Tooltip - positioned outside diagram container */}
      {hoveredInfo && (
        <div className="mt-4 px-4 py-3 bg-background border border-border rounded-lg shadow-lg text-sm">
          <div className="text-foreground-secondary">
            <span className="font-semibold text-foreground">{hoveredInfo.title}</span> —{' '}
            {hoveredInfo.description}
          </div>
        </div>
      )}
    </div>
  );
}
