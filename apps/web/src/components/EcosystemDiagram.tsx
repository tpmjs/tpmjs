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
  type: 'hllm' | 'tpmjs' | 'blocksai' | 'shared' | 'flow';
  cluster?: string;
}

interface Connection {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
  dashed?: boolean;
}

const nodeDescriptions: Record<string, { title: string; description: string }> = {
  // HLLM cluster
  'hllm-ui': {
    title: 'HLLM Playground',
    description:
      'Next.js web app for multi-agent orchestration. Users can configure agents, select topologies, and execute workflows with real-time visualization.',
  },
  'hllm-topologies': {
    title: '13 Topology Patterns',
    description:
      'Sequential, parallel, debate, reflection, consensus, brainstorm, decomposition, tree-of-thoughts, react, and more orchestration patterns.',
  },
  'hllm-agents': {
    title: 'Agent Configuration',
    description:
      'Configure agents with custom models, system prompts, temperature, tools, and memory windows. Each agent can use different AI providers via OpenRouter.',
  },
  'hllm-tools': {
    title: 'TPMJS Tool Browser',
    description:
      'In-app tool selector that fetches from the TPMJS registry. Browse, search, and attach tools to agents by category.',
  },

  // TPMJS cluster
  'tpmjs-registry': {
    title: 'Tool Registry',
    description:
      '100+ AI tools automatically discovered from npm. Searchable by category, quality score, and health status.',
  },
  'tpmjs-executor': {
    title: 'Sandbox Executor',
    description:
      'Deno-based sandboxed execution environment on Railway. Tools are loaded dynamically from esm.sh and executed securely.',
  },
  'tpmjs-api': {
    title: 'REST APIs',
    description:
      '/api/tools for search, /api/tools/execute for execution. Supports filtering, pagination, and SSE streaming.',
  },
  'tpmjs-tools': {
    title: '106 Official Tools',
    description:
      'Web scraping, data processing, text analysis, security, statistics, agent utilities, and more.',
  },

  // BlocksAI cluster
  'blocks-yml': {
    title: 'blocks.yml',
    description:
      'Domain-driven configuration file defining blocks, domain rules, entities, signals, and measures.',
  },
  'blocks-validators': {
    title: '3-Layer Validation',
    description:
      'Schema validation (Zod), Shape validation (TypeScript structure), Domain validation (AI-powered semantic analysis).',
  },
  'blocks-cli': {
    title: 'blocks CLI',
    description:
      'npx blocks run --all validates all blocks. Supports parallel rule validation and JSON output.',
  },
  'blocks-ai': {
    title: 'AI Validation',
    description:
      'Uses GPT-4 or Claude to analyze source code against domain rules. Checks semantic alignment and domain intent.',
  },

  // Shared technologies
  'shared-d3': {
    title: 'D3.js Visualizations',
    description:
      'Both HLLM and TPMJS use D3 for interactive diagrams: topology graphs, architecture diagrams, and flow visualizations.',
  },
  'shared-ai-sdk': {
    title: 'Vercel AI SDK v6',
    description:
      'Common foundation for tool definitions using tool() + jsonSchema(). Enables streaming, multi-step execution, and tool calling.',
  },
  'shared-prisma': {
    title: 'Prisma + PostgreSQL',
    description:
      'Both projects use Prisma ORM with PostgreSQL for data persistence. HLLM for sessions/traces, TPMJS for tool metadata.',
  },

  // Flow nodes
  'flow-execute': {
    title: 'Tool Execution',
    description:
      'HLLM calls TPMJS executor to run tools. Environment variables are encrypted per-user and injected at runtime.',
  },
  'flow-validate': {
    title: 'Tool Validation',
    description:
      'TPMJS tools are validated using BlocksAI patterns. blocks.yml defines domain rules for tool quality.',
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

export function EcosystemDiagram(): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth, 950);
        setDimensions({ width, height: 720 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const colors = getThemeColors(containerRef.current);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width } = dimensions;
    const scale = Math.min(1, width / 900);

    // Cluster colors
    const clusterColors = {
      hllm: '#8B5CF6', // Purple
      tpmjs: '#10B981', // Green
      blocksai: '#F59E0B', // Amber
      shared: '#6B7280', // Gray
      flow: '#3B82F6', // Blue
    };

    // Layout positions
    const nodes: Node[] = [
      // HLLM cluster (top-left)
      {
        id: 'hllm-ui',
        label: 'HLLM Playground',
        sublabel: 'Multi-Agent UI',
        x: 160 * scale,
        y: 80,
        width: 150 * scale,
        height: 50,
        type: 'hllm',
        cluster: 'hllm',
      },
      {
        id: 'hllm-topologies',
        label: '13 Topologies',
        sublabel: 'debate · react · etc',
        x: 160 * scale,
        y: 160,
        width: 145 * scale,
        height: 50,
        type: 'hllm',
        cluster: 'hllm',
      },
      {
        id: 'hllm-agents',
        label: 'Agent Studio',
        sublabel: '100+ Models',
        x: 80 * scale,
        y: 240,
        width: 120 * scale,
        height: 50,
        type: 'hllm',
        cluster: 'hllm',
      },
      {
        id: 'hllm-tools',
        label: 'Tool Browser',
        sublabel: 'TPMJS Integration',
        x: 240 * scale,
        y: 240,
        width: 135 * scale,
        height: 50,
        type: 'hllm',
        cluster: 'hllm',
      },

      // TPMJS cluster (top-right)
      {
        id: 'tpmjs-registry',
        label: 'Tool Registry',
        sublabel: 'tpmjs.com',
        x: 740 * scale,
        y: 80,
        width: 130 * scale,
        height: 50,
        type: 'tpmjs',
        cluster: 'tpmjs',
      },
      {
        id: 'tpmjs-api',
        label: 'REST APIs',
        sublabel: '/api/tools',
        x: 740 * scale,
        y: 160,
        width: 120 * scale,
        height: 50,
        type: 'tpmjs',
        cluster: 'tpmjs',
      },
      {
        id: 'tpmjs-executor',
        label: 'Sandbox',
        sublabel: 'Deno Runtime',
        x: 650 * scale,
        y: 240,
        width: 115 * scale,
        height: 50,
        type: 'tpmjs',
        cluster: 'tpmjs',
      },
      {
        id: 'tpmjs-tools',
        label: '106 Tools',
        sublabel: '@tpmjs/tools-*',
        x: 820 * scale,
        y: 240,
        width: 115 * scale,
        height: 50,
        type: 'tpmjs',
        cluster: 'tpmjs',
      },

      // BlocksAI cluster (bottom)
      {
        id: 'blocks-yml',
        label: 'blocks.yml',
        sublabel: 'Domain Config',
        x: 350 * scale,
        y: 560,
        width: 120 * scale,
        height: 50,
        type: 'blocksai',
        cluster: 'blocksai',
      },
      {
        id: 'blocks-validators',
        label: '3-Layer Pipeline',
        sublabel: 'Schema→Shape→Domain',
        x: 550 * scale,
        y: 560,
        width: 160 * scale,
        height: 50,
        type: 'blocksai',
        cluster: 'blocksai',
      },
      {
        id: 'blocks-cli',
        label: 'blocks CLI',
        sublabel: 'npx blocks run',
        x: 350 * scale,
        y: 640,
        width: 120 * scale,
        height: 50,
        type: 'blocksai',
        cluster: 'blocksai',
      },
      {
        id: 'blocks-ai',
        label: 'AI Validation',
        sublabel: 'GPT-4 / Claude',
        x: 550 * scale,
        y: 640,
        width: 130 * scale,
        height: 50,
        type: 'blocksai',
        cluster: 'blocksai',
      },

      // Shared technologies (middle)
      {
        id: 'shared-ai-sdk',
        label: 'AI SDK v6',
        sublabel: 'tool() + jsonSchema()',
        x: 450 * scale,
        y: 340,
        width: 145 * scale,
        height: 45,
        type: 'shared',
        cluster: 'shared',
      },
      {
        id: 'shared-d3',
        label: 'D3.js',
        sublabel: 'Visualizations',
        x: 320 * scale,
        y: 400,
        width: 100 * scale,
        height: 45,
        type: 'shared',
        cluster: 'shared',
      },
      {
        id: 'shared-prisma',
        label: 'Prisma',
        sublabel: 'PostgreSQL',
        x: 580 * scale,
        y: 400,
        width: 100 * scale,
        height: 45,
        type: 'shared',
        cluster: 'shared',
      },

      // Flow nodes (integration points)
      {
        id: 'flow-execute',
        label: 'Tool Execution',
        sublabel: 'HLLM → TPMJS',
        x: 450 * scale,
        y: 200,
        width: 140 * scale,
        height: 45,
        type: 'flow',
        cluster: 'flow',
      },
      {
        id: 'flow-validate',
        label: 'Validation',
        sublabel: 'TPMJS → BlocksAI',
        x: 650 * scale,
        y: 470,
        width: 130 * scale,
        height: 45,
        type: 'flow',
        cluster: 'flow',
      },
    ];

    const connections: Connection[] = [
      // HLLM internal
      { from: 'hllm-ui', to: 'hllm-topologies', animated: true },
      { from: 'hllm-topologies', to: 'hllm-agents', animated: true },
      { from: 'hllm-topologies', to: 'hllm-tools', animated: true },

      // TPMJS internal
      { from: 'tpmjs-registry', to: 'tpmjs-api', animated: true },
      { from: 'tpmjs-api', to: 'tpmjs-executor', animated: true },
      { from: 'tpmjs-api', to: 'tpmjs-tools', animated: true },

      // BlocksAI internal
      { from: 'blocks-yml', to: 'blocks-validators', animated: true },
      { from: 'blocks-yml', to: 'blocks-cli', animated: true },
      { from: 'blocks-validators', to: 'blocks-ai', animated: true },

      // Cross-project integrations
      { from: 'hllm-tools', to: 'flow-execute', animated: true, label: 'fetch tools' },
      { from: 'flow-execute', to: 'tpmjs-api', animated: true, label: 'execute' },
      { from: 'tpmjs-tools', to: 'flow-validate', animated: true, label: 'validate' },
      { from: 'flow-validate', to: 'blocks-validators', animated: true },

      // Shared technology connections (dashed)
      { from: 'hllm-topologies', to: 'shared-ai-sdk', dashed: true },
      { from: 'tpmjs-tools', to: 'shared-ai-sdk', dashed: true },
      { from: 'hllm-ui', to: 'shared-d3', dashed: true },
      { from: 'tpmjs-registry', to: 'shared-d3', dashed: true },
      { from: 'hllm-ui', to: 'shared-prisma', dashed: true },
      { from: 'tpmjs-registry', to: 'shared-prisma', dashed: true },
    ];

    // Create defs
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs
      .append('filter')
      .attr('id', 'eco-glow')
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
      .attr('id', 'eco-shadow')
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
      .attr('flood-opacity', '0.08');

    // Arrow markers for each cluster
    Object.entries(clusterColors).forEach(([key, color]) => {
      defs
        .append('marker')
        .attr('id', `eco-arrow-${key}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    const mainGroup = svg.append('g');

    // Draw cluster backgrounds
    const clusters = [
      {
        id: 'hllm',
        label: 'HLLM',
        x: 30 * scale,
        y: 40,
        width: 300 * scale,
        height: 280,
        color: clusterColors.hllm,
      },
      {
        id: 'tpmjs',
        label: 'TPMJS',
        x: 580 * scale,
        y: 40,
        width: 300 * scale,
        height: 280,
        color: clusterColors.tpmjs,
      },
      {
        id: 'blocksai',
        label: 'BlocksAI',
        x: 280 * scale,
        y: 520,
        width: 350 * scale,
        height: 190,
        color: clusterColors.blocksai,
      },
    ];

    clusters.forEach((cluster) => {
      const clusterGroup = mainGroup.append('g');

      // Background
      clusterGroup
        .append('rect')
        .attr('x', cluster.x)
        .attr('y', cluster.y)
        .attr('width', cluster.width)
        .attr('height', cluster.height)
        .attr('rx', 12)
        .attr('fill', cluster.color)
        .attr('opacity', 0.05)
        .attr('stroke', cluster.color)
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3);

      // Label
      clusterGroup
        .append('text')
        .attr('x', cluster.x + 12)
        .attr('y', cluster.y + 24)
        .attr('fill', cluster.color)
        .attr('font-size', '14px')
        .attr('font-weight', '700')
        .attr('font-family', 'ui-monospace, monospace')
        .text(cluster.label);
    });

    // Draw connections
    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const fromCluster = fromNode.cluster || 'shared';
      const color = clusterColors[fromCluster as keyof typeof clusterColors];

      // Calculate connection points
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const angle = Math.atan2(dy, dx);

      const startX = fromNode.x + (fromNode.width / 2) * Math.cos(angle);
      const startY = fromNode.y + (fromNode.height / 2) * Math.sin(angle);
      const endX = toNode.x - (toNode.width / 2 + 8) * Math.cos(angle);
      const endY = toNode.y - (toNode.height / 2 + 8) * Math.sin(angle);

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // Curved path
      const pathData = `M ${startX} ${startY} Q ${midX} ${midY - 20}, ${endX} ${endY}`;

      // Background path
      mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', colors.border)
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.3);

      // Main path
      const mainPath = mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', conn.dashed ? 1 : 1.5)
        .attr('stroke-dasharray', conn.dashed ? '4,4' : conn.animated ? '6,10' : 'none')
        .attr('stroke-opacity', conn.dashed ? 0.4 : 0.7)
        .attr('marker-end', `url(#eco-arrow-${fromCluster})`);

      // Animate
      if (conn.animated && !conn.dashed) {
        const animate = () => {
          mainPath
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', -32)
            .on('end', animate);
        };
        animate();
      }

      // Connection label
      if (conn.label) {
        mainGroup
          .append('text')
          .attr('x', midX)
          .attr('y', midY - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.foregroundTertiary)
          .attr('font-size', '9px')
          .attr('font-family', 'ui-monospace, monospace')
          .text(conn.label);
      }
    });

    // Draw nodes
    nodes.forEach((node, i) => {
      const nodeColor = clusterColors[node.type as keyof typeof clusterColors];

      const nodeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          setHoveredNode(node.id);
          d3.select(this).select('.main-rect').transition().duration(200).attr('stroke-width', 2.5);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0.3);
        })
        .on('mouseleave', function () {
          setHoveredNode(null);
          d3.select(this).select('.main-rect').transition().duration(200).attr('stroke-width', 1.5);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0);
        });

      // Glow effect
      nodeGroup
        .append('rect')
        .attr('class', 'node-glow')
        .attr('x', -node.width / 2 - 4)
        .attr('y', -node.height / 2 - 4)
        .attr('width', node.width + 8)
        .attr('height', node.height + 8)
        .attr('rx', 10)
        .attr('fill', nodeColor)
        .attr('opacity', 0)
        .attr('filter', 'url(#eco-glow)');

      // Main rectangle
      nodeGroup
        .append('rect')
        .attr('class', 'main-rect')
        .attr('x', -node.width / 2)
        .attr('y', -node.height / 2)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('rx', 8)
        .attr('fill', colors.background)
        .attr('stroke', nodeColor)
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#eco-shadow)');

      // Label
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', node.sublabel ? -4 : 4)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.foreground)
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'ui-monospace, monospace')
        .text(node.label);

      // Sublabel
      if (node.sublabel) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', 12)
          .attr('text-anchor', 'middle')
          .attr('fill', colors.foregroundTertiary)
          .attr('font-size', '9px')
          .attr('font-family', 'ui-monospace, monospace')
          .text(node.sublabel);
      }

      // Entrance animation
      nodeGroup
        .attr('opacity', 0)
        .attr('transform', `translate(${node.x}, ${node.y - 10})`)
        .transition()
        .delay(100 + i * 40)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', `translate(${node.x}, ${node.y})`);
    });

    // Legend
    const legendY = 680;
    const legendItems = [
      { label: 'HLLM', color: clusterColors.hllm },
      { label: 'TPMJS', color: clusterColors.tpmjs },
      { label: 'BlocksAI', color: clusterColors.blocksai },
      { label: 'Integration', color: clusterColors.flow },
      { label: 'Shared Tech', color: clusterColors.shared },
    ];

    const legendGroup = mainGroup
      .append('g')
      .attr('transform', `translate(${width / 2 - 200}, ${legendY})`);

    legendItems.forEach((item, index) => {
      const itemGroup = legendGroup.append('g').attr('transform', `translate(${index * 85}, 0)`);

      itemGroup
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 3)
        .attr('fill', item.color)
        .attr('opacity', 0.8);

      itemGroup
        .append('text')
        .attr('x', 16)
        .attr('y', 10)
        .attr('fill', colors.foregroundSecondary)
        .attr('font-size', '10px')
        .attr('font-family', 'ui-monospace, monospace')
        .text(item.label);
    });
  }, [dimensions]);

  const hoveredInfo = hoveredNode ? nodeDescriptions[hoveredNode] : null;

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative p-4 md:p-6 border border-border rounded-xl bg-surface/50 backdrop-blur overflow-hidden">
        {/* Grid background */}
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
          aria-label="Ajax's AI Infrastructure Ecosystem diagram showing HLLM, TPMJS, and BlocksAI"
        />
      </div>

      {/* Tooltip */}
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
