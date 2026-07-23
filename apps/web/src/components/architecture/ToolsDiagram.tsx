'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * ToolsDiagram - Visualizes the anatomy of a TPMJS tool package
 * Shows: package.json structure → exports → AI SDK tool format
 */
export function ToolsDiagram(): React.ReactElement {
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
    const centerX = width / 2;

    // Layout constants - more spacious
    const leftX = Math.max(100, width * 0.22);
    const rightX = Math.min(width - 100, width * 0.78);
    const topY = 70;
    const midY = height / 2;
    const bottomY = height - 70;

    // === Package.json section (left) ===
    drawNode(mainGroup, leftX, topY, 160, 60, {
      label: 'package.json',
      sublabel: 'npm package',
      type: 'warning',
      tooltip: {
        title: 'Package Manifest',
        description:
          'Standard npm package.json with "tpmjs" keyword and tpmjs configuration field.',
      },
      delay: 0,
    });

    // Keywords box
    drawNode(mainGroup, leftX - 55, midY - 15, 100, 44, {
      label: '"tpmjs"',
      sublabel: 'keyword',
      type: 'neutral',
      tooltip: {
        title: 'Required Keyword',
        description: 'Add "tpmjs" to keywords array for automatic discovery by the registry.',
      },
      delay: 100,
    });

    // tpmjs field box
    drawNode(mainGroup, leftX + 55, midY - 15, 100, 44, {
      label: 'tpmjs: {...}',
      sublabel: 'config',
      type: 'neutral',
      tooltip: {
        title: 'TPMJS Configuration',
        description: 'Category, frameworks, environment variables, and optional tool definitions.',
      },
      delay: 150,
    });

    // === Tool Export (center) ===
    drawNode(mainGroup, centerX, midY + 50, 180, 65, {
      label: 'Tool Export',
      sublabel: 'ES Module',
      type: 'primary',
      tooltip: {
        title: 'Tool Export',
        description:
          'Named export with description, parameters (Zod schema), and execute function.',
      },
      delay: 200,
    });

    // === AI SDK Format (right) ===
    drawNode(mainGroup, rightX, topY, 150, 60, {
      label: 'AI SDK Tool',
      sublabel: 'AI SDK',
      type: 'success',
      tooltip: {
        title: 'AI SDK Compatible',
        description:
          'Tools work with AI SDK, LangChain, and any framework supporting the tool format.',
      },
      delay: 250,
    });

    // Tool properties
    const props = [
      {
        label: 'description',
        sublabel: 'string',
        tooltip: { title: 'Description', description: 'Human-readable description for the AI.' },
      },
      {
        label: 'parameters',
        sublabel: 'z.object()',
        tooltip: { title: 'Parameters', description: 'Zod schema defining input validation.' },
      },
      {
        label: 'execute()',
        sublabel: 'async fn',
        tooltip: { title: 'Execute Function', description: 'Async function that runs the tool.' },
      },
    ];

    props.forEach((prop, i) => {
      const y = bottomY - 30 + (i - 1) * 44;
      drawNode(mainGroup, rightX, y, 120, 36, {
        label: prop.label,
        sublabel: prop.sublabel,
        type: i === 1 ? 'info' : 'neutral',
        tooltip: prop.tooltip,
        delay: 300 + i * 50,
      });
    });

    // === Connections ===
    // package.json to keywords/config
    drawConnection(mainGroup, leftX - 35, topY + 30, leftX - 55, midY - 37, {
      animated: true,
      delay: 400,
    });
    drawConnection(mainGroup, leftX + 35, topY + 30, leftX + 55, midY - 37, {
      animated: true,
      delay: 450,
    });

    // Config to tool export
    drawConnection(mainGroup, leftX + 55, midY + 7, centerX - 90, midY + 50, {
      label: 'exports',
      animated: true,
      delay: 500,
    });

    // Tool export to AI SDK
    drawConnection(mainGroup, centerX + 90, midY + 35, rightX - 75, topY + 25, {
      label: 'compatible',
      animated: true,
      curved: true,
      delay: 550,
    });

    // AI SDK to properties
    drawConnection(mainGroup, rightX, topY + 30, rightX, bottomY - 74, {
      animated: true,
      dashed: true,
      delay: 600,
    });

    // Code example annotation
    const codeGroup = mainGroup
      .append('g')
      .attr('transform', `translate(${centerX}, ${bottomY + 10})`);

    codeGroup
      .append('rect')
      .attr('x', -120)
      .attr('y', -18)
      .attr('width', 240)
      .attr('height', 36)
      .attr('rx', 6)
      .attr('fill', isDark ? '#1a1a2e' : '#f8f9fa')
      .attr('stroke', isDark ? '#333' : '#e9ecef')
      .attr('stroke-width', 1);

    codeGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#a5d6a7' : '#2e7d32')
      .attr('font-size', '12px')
      .attr('font-family', 'ui-monospace, monospace')
      .text('export const myTool = tool({...})');
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
        aria-label="TPMJS Tool package structure diagram"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
