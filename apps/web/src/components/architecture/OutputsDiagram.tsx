'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * OutputsDiagram - Visualizes response format options
 * Shows: Executor Output → SSE (streaming) / JSON-RPC (MCP)
 */
export function OutputsDiagram(): React.ReactElement {
  const {
    svgRef,
    containerRef,
    tooltipRef,
    dimensions,
    mounted,
    isDark,
    setupSvg,
    drawConnection,
    drawNode,
  } = useDiagramSetup({ defaultHeight: 400 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: svgRef.current is a ref and doesn't need to be in deps
  useEffect(() => {
    if (!svgRef.current || !mounted) return;

    const svg = d3.select(svgRef.current);
    const mainGroup = setupSvg(svg);

    const { width, height } = dimensions;

    // Layout - split view for two formats
    const centerX = width / 2;
    const leftX = Math.max(110, width * 0.28);
    const rightX = Math.min(width - 110, width * 0.72);

    const topY = 60;
    const midY = height / 2;
    const bottomY = height - 55;

    // === Source: Tool Execution Result (top center) ===
    drawNode(mainGroup, centerX, topY, 170, 60, {
      label: 'Execution Result',
      sublabel: 'from sandbox',
      type: 'primary',
      tooltip: {
        title: 'Execution Result',
        description:
          'Tool output from sandboxed Deno runtime. Contains result data, timing, and errors.',
      },
      delay: 0,
    });

    // Result fields
    const resultFields = [
      { label: 'data', tooltip: { title: 'Data', description: "The tool's return value." } },
      { label: 'timing', tooltip: { title: 'Timing', description: 'Execution duration in ms.' } },
      { label: 'status', tooltip: { title: 'Status', description: 'Success or error state.' } },
    ];

    resultFields.forEach((f, i) => {
      const x = centerX - 60 + i * 60;
      drawNode(mainGroup, x, topY + 55, 55, 28, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 50 + i * 25,
      });
    });

    // === SSE Response (left side) ===
    drawNode(mainGroup, leftX, midY, 150, 65, {
      label: 'SSE Response',
      sublabel: 'Server-Sent Events',
      type: 'success',
      tooltip: {
        title: 'SSE Streaming',
        description:
          'Real-time streaming for AI agents. Events flow as they are generated. Best for chat UIs.',
      },
      delay: 150,
    });

    // SSE features
    const sseFeatures = [
      {
        label: 'text/event-stream',
        tooltip: { title: 'Content Type', description: 'Standard SSE MIME type for browsers.' },
      },
      {
        label: 'Real-time chunks',
        tooltip: {
          title: 'Streaming Chunks',
          description: 'Data sent incrementally as tool executes.',
        },
      },
      {
        label: 'AI SDK',
        tooltip: {
          title: 'SDK Compatibility',
          description: 'Works with useChat, streamText, and AI SDK primitives.',
        },
      },
    ];

    sseFeatures.forEach((f, i) => {
      drawNode(mainGroup, leftX, midY + 55 + i * 38, 125, 30, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 200 + i * 30,
      });
    });

    // === JSON-RPC Response (right side) ===
    drawNode(mainGroup, rightX, midY, 150, 65, {
      label: 'JSON-RPC',
      sublabel: 'MCP Protocol',
      type: 'info',
      tooltip: {
        title: 'JSON-RPC 2.0',
        description:
          'Model Context Protocol standard. Used by Claude Desktop, Cursor, and MCP clients.',
      },
      delay: 300,
    });

    // JSON-RPC features
    const rpcFeatures = [
      {
        label: 'application/json',
        tooltip: { title: 'Content Type', description: 'Standard JSON MIME type.' },
      },
      {
        label: 'Request/Response',
        tooltip: {
          title: 'Request Pattern',
          description: 'Single request, single response model.',
        },
      },
      {
        label: 'MCP Clients',
        tooltip: {
          title: 'Client Support',
          description: 'Claude Desktop, Cursor IDE, and any MCP-compatible client.',
        },
      },
    ];

    rpcFeatures.forEach((f, i) => {
      drawNode(mainGroup, rightX, midY + 55 + i * 38, 125, 30, {
        label: f.label,
        type: 'neutral',
        tooltip: f.tooltip,
        delay: 350 + i * 30,
      });
    });

    // === Use Case Labels (bottom) ===
    drawNode(mainGroup, leftX, bottomY, 130, 50, {
      label: 'AI Agents',
      sublabel: 'Chat interfaces',
      type: 'secondary',
      tooltip: {
        title: 'Agent Use Case',
        description: 'TPMJS Agents use SSE for streaming chat responses to the browser.',
      },
      delay: 450,
    });

    drawNode(mainGroup, rightX, bottomY, 130, 50, {
      label: 'MCP Servers',
      sublabel: 'Tool serving',
      type: 'secondary',
      tooltip: {
        title: 'MCP Use Case',
        description: 'MCP servers expose tools via JSON-RPC for desktop AI applications.',
      },
      delay: 480,
    });

    // === Connections ===
    // Result to fields
    drawConnection(mainGroup, centerX, topY + 30, centerX, topY + 41, {
      animated: true,
      dashed: true,
      delay: 500,
    });

    // Result to SSE
    drawConnection(mainGroup, centerX - 70, topY + 45, leftX + 60, midY - 35, {
      label: 'stream',
      animated: true,
      curved: true,
      delay: 520,
    });

    // Result to JSON-RPC
    drawConnection(mainGroup, centerX + 70, topY + 45, rightX - 60, midY - 35, {
      label: 'respond',
      animated: true,
      curved: true,
      delay: 540,
    });

    // SSE to features
    drawConnection(mainGroup, leftX, midY + 32, leftX, midY + 40, {
      animated: true,
      dashed: true,
      delay: 560,
    });

    // JSON-RPC to features
    drawConnection(mainGroup, rightX, midY + 32, rightX, midY + 40, {
      animated: true,
      dashed: true,
      delay: 580,
    });

    // SSE to use case
    drawConnection(mainGroup, leftX, midY + 55 + 2 * 38 + 15, leftX, bottomY - 25, {
      animated: true,
      delay: 600,
    });

    // JSON-RPC to use case
    drawConnection(mainGroup, rightX, midY + 55 + 2 * 38 + 15, rightX, bottomY - 25, {
      animated: true,
      delay: 620,
    });

    // Protocol badges
    const badges = [
      { x: leftX, label: '📡 Streaming', color: isDark ? '#1b4332' : '#e8f5e9' },
      { x: rightX, label: '📦 Batched', color: isDark ? '#1a3a5c' : '#e3f2fd' },
    ];

    badges.forEach((badge) => {
      const badgeGroup = mainGroup
        .append('g')
        .attr('transform', `translate(${badge.x}, ${midY - 55})`);

      badgeGroup
        .append('rect')
        .attr('x', -50)
        .attr('y', -12)
        .attr('width', 100)
        .attr('height', 24)
        .attr('rx', 12)
        .attr('fill', badge.color)
        .attr('stroke', isDark ? '#444' : '#ccc');

      badgeGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 5)
        .attr('fill', isDark ? '#e0e0e0' : '#333')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text(badge.label);
    });
  }, [dimensions, mounted, isDark, setupSvg, drawConnection, drawNode]);

  if (!mounted) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="h-80 bg-surface/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full"
        role="img"
        aria-label="Output formats diagram showing SSE and JSON-RPC"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
