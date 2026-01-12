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

    const width = 720;
    const height = 520;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Define gradients
    const defs = svg.append('defs');

    // Machine gradient
    const machineGrad = defs
      .append('linearGradient')
      .attr('id', 'machineGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    machineGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    machineGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    // Bridge gradient
    const bridgeGrad = defs
      .append('linearGradient')
      .attr('id', 'bridgeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    bridgeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0d9488');
    bridgeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f766e');

    // Cloud gradient
    const cloudGrad = defs
      .append('linearGradient')
      .attr('id', 'cloudGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    cloudGrad.append('stop').attr('offset', '0%').attr('stop-color', '#2563eb');
    cloudGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1d4ed8');

    // Glow filter for bridge
    const glowFilter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Drop shadow filter
    const shadowFilter = defs
      .append('filter')
      .attr('id', 'shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadowFilter
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '8')
      .attr('flood-color', 'rgba(0,0,0,0.3)');

    // Arrow marker with gradient
    defs
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
      .attr('fill', '#14b8a6');

    // Animated arrow marker
    defs
      .append('marker')
      .attr('id', 'arrowheadAnimated')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#3b82f6');

    // Colors
    const colors = {
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      textDark: '#cbd5e1',
      serverBox: '#334155',
      serverStroke: '#475569',
      arrow: '#14b8a6',
      arrowPulse: '#5eead4',
    };

    // User's Machine container
    const machineGroup = svg.append('g').attr('class', 'machine-group');

    // Machine box with shadow
    machineGroup
      .append('rect')
      .attr('x', 20)
      .attr('y', 20)
      .attr('width', width - 40)
      .attr('height', 290)
      .attr('rx', 16)
      .attr('fill', 'url(#machineGradient)')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#shadow)');

    // Machine label with icon
    machineGroup
      .append('text')
      .attr('x', 50)
      .attr('y', 52)
      .attr('fill', colors.text)
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.05em')
      .text('YOUR MACHINE');

    // Decorative dots
    [0, 1, 2].forEach((i) => {
      machineGroup
        .append('circle')
        .attr('cx', width - 50 - i * 16)
        .attr('cy', 48)
        .attr('r', 5)
        .attr('fill', i === 0 ? '#ef4444' : i === 1 ? '#eab308' : '#22c55e')
        .attr('opacity', 0.8);
    });

    // MCP Servers
    const servers = [
      { name: 'Chrome MCP', icon: '🌐', y: 85 },
      { name: 'Filesystem', icon: '📁', y: 155 },
      { name: 'Custom Server', icon: '⚡', y: 225 },
    ];

    servers.forEach((server, idx) => {
      const serverGroup = machineGroup.append('g').attr('class', `server-${idx}`);

      // Server box with hover effect
      serverGroup
        .append('rect')
        .attr('x', 50)
        .attr('y', server.y)
        .attr('width', 150)
        .attr('height', 55)
        .attr('rx', 10)
        .attr('fill', colors.serverBox)
        .attr('stroke', colors.serverStroke)
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke', '#14b8a6')
            .attr('stroke-width', 2);
        })
        .on('mouseleave', function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke', colors.serverStroke)
            .attr('stroke-width', 1.5);
        });

      // Server icon
      serverGroup
        .append('text')
        .attr('x', 70)
        .attr('y', server.y + 35)
        .attr('font-size', '20px')
        .text(server.icon);

      // Server label
      serverGroup
        .append('text')
        .attr('x', 100)
        .attr('y', server.y + 35)
        .attr('fill', colors.text)
        .attr('font-size', '14px')
        .attr('font-weight', '500')
        .text(server.name);

      // Animated arrow from server to bridge
      const arrowPath = serverGroup
        .append('path')
        .attr('d', `M 200 ${server.y + 27} L 280 ${server.y + 27}`)
        .attr('stroke', colors.arrow)
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('stroke-dasharray', '80')
        .attr('stroke-dashoffset', '80');

      // Animate arrow on load with stagger
      arrowPath
        .transition()
        .delay(300 + idx * 150)
        .duration(600)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', '0');
    });

    // Bridge CLI box with glow
    const bridgeGroup = machineGroup.append('g').attr('class', 'bridge-group');

    bridgeGroup
      .append('rect')
      .attr('x', 290)
      .attr('y', 75)
      .attr('width', 370)
      .attr('height', 215)
      .attr('rx', 12)
      .attr('fill', 'url(#bridgeGradient)')
      .attr('stroke', '#5eead4')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Bridge header bar
    bridgeGroup
      .append('rect')
      .attr('x', 290)
      .attr('y', 75)
      .attr('width', 370)
      .attr('height', 40)
      .attr('rx', 12)
      .attr('fill', 'rgba(0,0,0,0.2)');

    // Fix bottom corners of header
    bridgeGroup
      .append('rect')
      .attr('x', 290)
      .attr('y', 103)
      .attr('width', 370)
      .attr('height', 12)
      .attr('fill', 'rgba(0,0,0,0.2)');

    // Bridge label
    bridgeGroup
      .append('text')
      .attr('x', 475)
      .attr('y', 102)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.text)
      .attr('font-size', '15px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.02em')
      .text('@tpmjs/bridge');

    // Bridge features with icons
    const features = [
      { icon: '🔗', text: 'Connects to MCP servers' },
      { icon: '📝', text: 'Registers tools with TPMJS' },
      { icon: '📡', text: 'Polls for tool calls' },
      { icon: '✨', text: 'Returns results' },
    ];

    features.forEach((feature, i) => {
      const featureGroup = bridgeGroup.append('g').attr('class', `feature-${i}`);

      featureGroup
        .append('text')
        .attr('x', 320)
        .attr('y', 150 + i * 32)
        .attr('font-size', '16px')
        .text(feature.icon);

      featureGroup
        .append('text')
        .attr('x', 350)
        .attr('y', 150 + i * 32)
        .attr('fill', colors.textDark)
        .attr('font-size', '14px')
        .text(feature.text);
    });

    // Animated pulse indicator
    const pulseGroup = bridgeGroup.append('g');

    pulseGroup.append('circle').attr('cx', 630).attr('cy', 95).attr('r', 6).attr('fill', '#22c55e');

    // Pulse animation
    const pulse = pulseGroup
      .append('circle')
      .attr('cx', 630)
      .attr('cy', 95)
      .attr('r', 6)
      .attr('fill', 'none')
      .attr('stroke', '#22c55e')
      .attr('stroke-width', 2);

    function animatePulse() {
      pulse
        .attr('r', 6)
        .attr('opacity', 1)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadOut)
        .attr('r', 18)
        .attr('opacity', 0)
        .on('end', animatePulse);
    }
    animatePulse();

    // HTTPS Arrow from machine to cloud with animation
    const httpsArrowGroup = svg.append('g').attr('class', 'https-arrow');

    // Arrow line
    const httpsLine = httpsArrowGroup
      .append('path')
      .attr('d', `M ${width / 2} 310 L ${width / 2} 365`)
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowheadAnimated)')
      .attr('stroke-dasharray', '55')
      .attr('stroke-dashoffset', '55');

    httpsLine
      .transition()
      .delay(900)
      .duration(500)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', '0');

    // HTTPS badge
    const httpsBadge = httpsArrowGroup
      .append('g')
      .attr('transform', `translate(${width / 2 + 20}, 335)`);

    httpsBadge
      .append('rect')
      .attr('x', -5)
      .attr('y', -12)
      .attr('width', 55)
      .attr('height', 20)
      .attr('rx', 4)
      .attr('fill', '#1e40af');

    httpsBadge
      .append('text')
      .attr('x', 22)
      .attr('y', 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#93c5fd')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text('HTTPS');

    // TPMJS Cloud box
    const cloudGroup = svg.append('g').attr('class', 'cloud-group');

    cloudGroup
      .append('rect')
      .attr('x', width / 2 - 150)
      .attr('y', 375)
      .attr('width', 300)
      .attr('height', 125)
      .attr('rx', 16)
      .attr('fill', 'url(#cloudGradient)')
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#shadow)');

    // Cloud icon
    cloudGroup
      .append('text')
      .attr('x', width / 2 - 120)
      .attr('y', 415)
      .attr('font-size', '28px')
      .text('☁️');

    // Cloud label
    cloudGroup
      .append('text')
      .attr('x', width / 2 - 80)
      .attr('y', 415)
      .attr('fill', colors.text)
      .attr('font-size', '18px')
      .attr('font-weight', '700')
      .text('TPMJS Cloud');

    // Cloud description
    cloudGroup
      .append('text')
      .attr('x', width / 2)
      .attr('y', 455)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textMuted)
      .attr('font-size', '14px')
      .text('Your AI agents use bridge tools');

    // AI icons
    const aiIcons = ['🤖', '💬', '🧠'];
    aiIcons.forEach((icon, i) => {
      cloudGroup
        .append('text')
        .attr('x', width / 2 - 40 + i * 40)
        .attr('y', 485)
        .attr('font-size', '20px')
        .attr('text-anchor', 'middle')
        .text(icon);
    });

    // Data flow animation dots
    function createFlowDot(startY: number, delay: number) {
      const dot = svg
        .append('circle')
        .attr('cx', width / 2)
        .attr('cy', startY)
        .attr('r', 4)
        .attr('fill', '#60a5fa')
        .attr('opacity', 0);

      function animate() {
        dot
          .attr('cy', startY)
          .attr('opacity', 0)
          .transition()
          .delay(delay)
          .duration(200)
          .attr('opacity', 1)
          .transition()
          .duration(800)
          .ease(d3.easeQuadIn)
          .attr('cy', 365)
          .transition()
          .duration(200)
          .attr('opacity', 0)
          .on('end', animate);
      }
      animate();
    }

    // Create multiple flow dots with different delays
    createFlowDot(315, 0);
    createFlowDot(315, 1200);
    createFlowDot(315, 2400);
  }, []);

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        className="w-full h-auto max-w-3xl mx-auto"
        style={{ minHeight: '420px' }}
      />
    </div>
  );
}
