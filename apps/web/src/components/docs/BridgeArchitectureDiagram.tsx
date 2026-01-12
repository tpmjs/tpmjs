'use client';

import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface BridgeArchitectureDiagramProps {
  className?: string;
}

export function BridgeArchitectureDiagram({ className }: BridgeArchitectureDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 700;
    const height = 500;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Colors
    const colors = {
      machineBox: '#1e293b',
      machineStroke: '#475569',
      serverBox: '#334155',
      serverStroke: '#64748b',
      bridgeBox: '#0f766e',
      bridgeStroke: '#14b8a6',
      cloudBox: '#1e40af',
      cloudStroke: '#3b82f6',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      arrow: '#64748b',
    };

    // User's Machine container
    const machineGroup = svg.append('g');

    // Machine box
    machineGroup
      .append('rect')
      .attr('x', 20)
      .attr('y', 20)
      .attr('width', width - 40)
      .attr('height', 280)
      .attr('rx', 12)
      .attr('fill', colors.machineBox)
      .attr('stroke', colors.machineStroke)
      .attr('stroke-width', 2);

    // Machine label
    machineGroup
      .append('text')
      .attr('x', width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .text('Your Machine');

    // MCP Servers
    const servers = [
      { name: 'Chrome MCP', y: 90 },
      { name: 'Filesystem', y: 160 },
      { name: 'Custom Server', y: 230 },
    ];

    servers.forEach((server) => {
      // Server box
      machineGroup
        .append('rect')
        .attr('x', 50)
        .attr('y', server.y)
        .attr('width', 140)
        .attr('height', 50)
        .attr('rx', 8)
        .attr('fill', colors.serverBox)
        .attr('stroke', colors.serverStroke)
        .attr('stroke-width', 1);

      // Server label
      machineGroup
        .append('text')
        .attr('x', 120)
        .attr('y', server.y + 30)
        .attr('text-anchor', 'middle')
        .attr('fill', colors.text)
        .attr('font-size', '13px')
        .text(server.name);

      // Arrow from server to bridge
      machineGroup
        .append('path')
        .attr('d', `M 190 ${server.y + 25} L 270 ${server.y + 25}`)
        .attr('stroke', colors.arrow)
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)');
    });

    // Bridge CLI box
    machineGroup
      .append('rect')
      .attr('x', 280)
      .attr('y', 80)
      .attr('width', 360)
      .attr('height', 210)
      .attr('rx', 10)
      .attr('fill', colors.bridgeBox)
      .attr('stroke', colors.bridgeStroke)
      .attr('stroke-width', 2);

    // Bridge label
    machineGroup
      .append('text')
      .attr('x', 460)
      .attr('y', 115)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '15px')
      .attr('font-weight', '600')
      .text('@tpmjs/bridge CLI');

    // Bridge features
    const features = [
      'Connects to MCP servers',
      'Registers tools with TPMJS',
      'Polls for tool calls',
      'Returns results',
    ];

    features.forEach((feature, i) => {
      machineGroup
        .append('text')
        .attr('x', 320)
        .attr('y', 155 + i * 28)
        .attr('fill', colors.textMuted)
        .attr('font-size', '13px')
        .text(`• ${feature}`);
    });

    // Arrow marker definition
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', colors.arrow);

    // HTTPS Arrow from machine to cloud
    svg
      .append('path')
      .attr('d', `M ${width / 2} 300 L ${width / 2} 340`)
      .attr('stroke', colors.arrow)
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // HTTPS label
    svg
      .append('text')
      .attr('x', width / 2 + 15)
      .attr('y', 328)
      .attr('fill', colors.textMuted)
      .attr('font-size', '12px')
      .text('HTTPS');

    // TPMJS Cloud box
    const cloudGroup = svg.append('g');

    cloudGroup
      .append('rect')
      .attr('x', width / 2 - 140)
      .attr('y', 350)
      .attr('width', 280)
      .attr('height', 120)
      .attr('rx', 12)
      .attr('fill', colors.cloudBox)
      .attr('stroke', colors.cloudStroke)
      .attr('stroke-width', 2);

    // Cloud label
    cloudGroup
      .append('text')
      .attr('x', width / 2)
      .attr('y', 385)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .text('TPMJS Cloud');

    // Cloud description
    cloudGroup
      .append('text')
      .attr('x', width / 2)
      .attr('y', 420)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textMuted)
      .attr('font-size', '14px')
      .text('Your AI uses');

    cloudGroup
      .append('text')
      .attr('x', width / 2)
      .attr('y', 445)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textMuted)
      .attr('font-size', '14px')
      .text('bridge tools');
  }, []);

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        className="w-full h-auto max-w-3xl mx-auto"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
