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
  type: 'agent' | 'tool' | 'service' | 'output';
  children?: string[];
}

interface Connection {
  from: string;
  to: string;
  animated?: boolean;
}

export function SDKFlowDiagram(): React.ReactElement {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth, 900);
        setDimensions({ width, height: 520 });
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

    const { width } = dimensions;
    const centerX = width / 2;

    // Node definitions
    const nodes: Node[] = [
      // Agent container
      {
        id: 'agent',
        label: 'Your AI Agent',
        x: centerX,
        y: 70,
        width: Math.min(680, width - 40),
        height: 100,
        type: 'agent',
        children: ['your-tools', 'registry-search', 'registry-execute'],
      },
      // Tools inside agent
      {
        id: 'your-tools',
        label: 'Your Tools',
        x: centerX - Math.min(220, width * 0.25),
        y: 70,
        width: 120,
        height: 44,
        type: 'tool',
      },
      {
        id: 'registry-search',
        label: 'registrySearch',
        x: centerX,
        y: 70,
        width: 140,
        height: 44,
        type: 'tool',
      },
      {
        id: 'registry-execute',
        label: 'registryExecute',
        x: centerX + Math.min(220, width * 0.25),
        y: 70,
        width: 140,
        height: 44,
        type: 'tool',
      },
      // Services
      {
        id: 'registry',
        label: 'TPMJS Registry',
        sublabel: 'tpmjs.com/api',
        x: centerX - Math.min(140, width * 0.16),
        y: 240,
        width: 160,
        height: 60,
        type: 'service',
      },
      {
        id: 'executor',
        label: 'Sandbox Executor',
        sublabel: 'executor.tpmjs.com',
        x: centerX + Math.min(140, width * 0.16),
        y: 240,
        width: 180,
        height: 60,
        type: 'service',
      },
      // Outputs
      {
        id: 'metadata',
        label: 'Tool Metadata',
        sublabel: '1000+ tools',
        x: centerX - Math.min(140, width * 0.16),
        y: 400,
        width: 150,
        height: 60,
        type: 'output',
      },
      {
        id: 'runtime',
        label: 'Secure Deno Runtime',
        sublabel: 'Isolated execution',
        x: centerX + Math.min(140, width * 0.16),
        y: 400,
        width: 180,
        height: 60,
        type: 'output',
      },
    ];

    const connections: Connection[] = [
      { from: 'registry-search', to: 'registry', animated: true },
      { from: 'registry-execute', to: 'executor', animated: true },
      { from: 'registry', to: 'metadata', animated: true },
      { from: 'executor', to: 'runtime', animated: true },
    ];

    // Create defs for gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Subtle shadow
    const shadow = defs
      .append('filter')
      .attr('id', 'shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadow
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '4')
      .attr('flood-color', 'currentColor')
      .attr('flood-opacity', '0.15');

    // Arrow marker
    defs
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
      .attr('fill', 'currentColor')
      .attr('class', 'text-foreground-tertiary');

    // Animated dash pattern
    defs
      .append('pattern')
      .attr('id', 'dash-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', '20')
      .attr('height', '1')
      .append('rect')
      .attr('width', '10')
      .attr('height', '1')
      .attr('fill', 'currentColor');

    const mainGroup = svg.append('g');

    // Draw connections with animated flow
    connections.forEach((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      const toNode = nodes.find((n) => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const startY = fromNode.y + fromNode.height / 2 + 22;
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
        .attr('stroke', 'currentColor')
        .attr('class', 'text-border')
        .attr('stroke-width', 2)
        .attr('opacity', 0.3);

      // Animated path
      const animatedPath = mainGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', 'currentColor')
        .attr('class', 'text-foreground')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,12')
        .attr('stroke-linecap', 'round')
        .attr('marker-end', 'url(#arrowhead)');

      // Animate the dash offset
      if (conn.animated) {
        const animate = () => {
          animatedPath
            .attr('stroke-dashoffset', 0)
            .transition()
            .duration(1500)
            .ease(d3.easeLinear)
            .attr('stroke-dashoffset', -40)
            .on('end', animate);
        };
        animate();
      }

      // Flowing particle effect
      const particle = mainGroup
        .append('circle')
        .attr('r', 4)
        .attr('fill', 'currentColor')
        .attr('class', 'text-primary')
        .attr('opacity', 0)
        .attr('filter', 'url(#glow)');

      const animateParticle = () => {
        const pathNode = animatedPath.node();
        if (!pathNode) return;
        const pathLength = (pathNode as SVGPathElement).getTotalLength();

        particle
          .attr('opacity', 0.8)
          .transition()
          .duration(2000)
          .ease(d3.easeQuadInOut)
          .attrTween('transform', () => {
            return (t: number) => {
              const point = (pathNode as SVGPathElement).getPointAtLength(t * pathLength);
              return `translate(${point.x}, ${point.y})`;
            };
          })
          .attr('opacity', 0)
          .on('end', () => {
            setTimeout(animateParticle, Math.random() * 1000 + 500);
          });
      };
      setTimeout(animateParticle, Math.random() * 2000);
    });

    // Draw agent container
    const agentNode = nodes.find((n) => n.id === 'agent');
    if (agentNode) {
      const agentGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${agentNode.x}, ${agentNode.y})`)
        .style('cursor', 'pointer');

      // Outer container with gradient border effect
      agentGroup
        .append('rect')
        .attr('x', -agentNode.width / 2)
        .attr('y', -agentNode.height / 2)
        .attr('width', agentNode.width)
        .attr('height', agentNode.height)
        .attr('rx', 16)
        .attr('fill', 'none')
        .attr('stroke', 'currentColor')
        .attr('class', 'text-border')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#shadow)');

      // Background fill
      agentGroup
        .append('rect')
        .attr('x', -agentNode.width / 2 + 1)
        .attr('y', -agentNode.height / 2 + 1)
        .attr('width', agentNode.width - 2)
        .attr('height', agentNode.height - 2)
        .attr('rx', 15)
        .attr('fill', 'currentColor')
        .attr('class', 'text-surface')
        .attr('opacity', 0.5);

      // Agent label
      agentGroup
        .append('text')
        .attr('x', 0)
        .attr('y', -agentNode.height / 2 + 24)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('class', 'text-foreground')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text(agentNode.label);
    }

    // Draw tool nodes inside agent
    const toolNodes = nodes.filter((n) => n.type === 'tool');
    toolNodes.forEach((node, i) => {
      const nodeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('class', 'tool-node')
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          setHoveredNode(node.id);
          d3.select(this).select('rect').transition().duration(200).attr('stroke-width', 2);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0.3);
        })
        .on('mouseleave', function () {
          setHoveredNode(null);
          d3.select(this).select('rect').transition().duration(200).attr('stroke-width', 1.5);
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
        .attr('rx', 12)
        .attr('fill', 'currentColor')
        .attr('class', 'node-glow text-primary')
        .attr('opacity', 0)
        .attr('filter', 'url(#glow)');

      // Main rectangle
      nodeGroup
        .append('rect')
        .attr('x', -node.width / 2)
        .attr('y', -node.height / 2)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('rx', 8)
        .attr('fill', 'currentColor')
        .attr('class', 'text-background')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 1.5)
        .style(
          'stroke',
          node.id === 'your-tools' ? 'var(--color-border)' : 'var(--color-foreground)'
        );

      // Label
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('class', 'text-foreground')
        .attr('font-size', '13px')
        .attr('font-weight', '500')
        .attr('font-family', 'ui-monospace, monospace')
        .text(node.label);

      // Entrance animation
      nodeGroup
        .attr('opacity', 0)
        .attr('transform', `translate(${node.x}, ${node.y - 20})`)
        .transition()
        .delay(200 + i * 100)
        .duration(500)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', `translate(${node.x}, ${node.y})`);
    });

    // Draw service and output nodes
    const otherNodes = nodes.filter((n) => n.type === 'service' || n.type === 'output');
    otherNodes.forEach((node, i) => {
      const nodeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          setHoveredNode(node.id);
          d3.select(this).select('.main-rect').transition().duration(200).attr('stroke-width', 2);
          d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0.2);
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
        .attr('rx', 14)
        .attr('fill', 'currentColor')
        .attr('class', 'node-glow text-primary')
        .attr('opacity', 0)
        .attr('filter', 'url(#glow)');

      // Main rectangle
      nodeGroup
        .append('rect')
        .attr('class', 'main-rect')
        .attr('x', -node.width / 2)
        .attr('y', -node.height / 2)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('rx', 10)
        .attr('fill', 'currentColor')
        .attr('class', 'text-background')
        .attr('stroke', 'currentColor')
        .attr('stroke-width', 1.5)
        .style(
          'stroke',
          node.type === 'output' ? 'var(--color-border)' : 'var(--color-foreground)'
        );

      // Label
      nodeGroup
        .append('text')
        .attr('x', 0)
        .attr('y', node.sublabel ? -4 : 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('class', 'text-foreground')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text(node.label);

      // Sublabel
      if (node.sublabel) {
        nodeGroup
          .append('text')
          .attr('x', 0)
          .attr('y', 14)
          .attr('text-anchor', 'middle')
          .attr('fill', 'currentColor')
          .attr('class', 'text-foreground-tertiary')
          .attr('font-size', '11px')
          .attr('font-family', 'ui-monospace, monospace')
          .text(node.sublabel);
      }

      // Entrance animation
      nodeGroup
        .attr('opacity', 0)
        .attr('transform', `translate(${node.x}, ${node.y + 30})`)
        .transition()
        .delay(500 + i * 150)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('opacity', 1)
        .attr('transform', `translate(${node.x}, ${node.y})`);
    });
  }, [dimensions]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative p-4 md:p-8 border border-border rounded-xl bg-surface/50 backdrop-blur overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="mx-auto relative"
          style={{ maxWidth: '100%', height: 'auto' }}
        />

        {/* Tooltip for hovered node */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-background border border-border rounded-lg shadow-lg text-sm max-w-md">
            {hoveredNode === 'your-tools' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">Your existing tools</span> — Any AI
                SDK tools you've already built or installed. These work alongside the registry tools
                seamlessly.
              </div>
            )}
            {hoveredNode === 'registry-search' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">registrySearchTool</span> — Query
                the TPMJS registry by keyword, category, or description. Returns tool metadata
                including the toolId needed for execution.
              </div>
            )}
            {hoveredNode === 'registry-execute' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">registryExecuteTool</span> — Execute
                any tool from the registry by its toolId. Pass parameters and API keys per-request.
                Results are returned directly to your agent.
              </div>
            )}
            {hoveredNode === 'registry' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">TPMJS Registry API</span> — Central
                repository of 1000+ AI SDK tools. Each tool is validated, health-checked, and
                includes schema definitions for type-safe execution.
              </div>
            )}
            {hoveredNode === 'executor' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">Sandbox Executor</span> — Remote
                execution environment hosted on Railway. Tools run in isolated Deno containers with
                no access to your local system.
              </div>
            )}
            {hoveredNode === 'metadata' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">Tool Metadata</span> — Complete tool
                information including name, description, parameter schemas, required environment
                variables, health status, and quality scores.
              </div>
            )}
            {hoveredNode === 'runtime' && (
              <div className="text-foreground-secondary">
                <span className="font-semibold text-foreground">Secure Deno Runtime</span> — Each
                tool execution runs in a fresh, isolated Deno sandbox. API keys are passed
                per-request and never stored. Network access is restricted to the tool's
                requirements.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
