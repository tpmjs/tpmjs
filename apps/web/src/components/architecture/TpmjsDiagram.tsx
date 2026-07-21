'use client';

import * as d3 from 'd3';
import { useEffect } from 'react';
import { useDiagramSetup } from './useDiagramSetup';

/**
 * TpmjsDiagram - Visualizes the TPMJS sync pipeline
 * Shows: Sync workers → Validation → Database → Quality Score → API
 */
export function TpmjsDiagram(): React.ReactElement {
  const {
    svgRef,
    containerRef,
    tooltipRef,
    dimensions,
    mounted,
    setupSvg,
    drawConnection,
    drawNode,
  } = useDiagramSetup({ defaultHeight: 420 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: svgRef.current is a ref and doesn't need to be in deps
  useEffect(() => {
    if (!svgRef.current || !mounted) return;

    const svg = d3.select(svgRef.current);
    const mainGroup = setupSvg(svg);

    const { width, height } = dimensions;

    // Layout - 3 columns
    const leftX = Math.max(90, width * 0.18);
    const centerX = width / 2;
    const rightX = Math.min(width - 90, width * 0.82);

    const topY = 55;
    const bottomY = height - 55;

    // === Sync Workers (top left) ===
    drawNode(mainGroup, leftX, topY, 150, 60, {
      label: 'Sync Workers',
      sublabel: 'Actions + timers',
      type: 'info',
      tooltip: {
        title: 'Sync Workers',
        description:
          'GitHub Actions and on-box systemd timers discover and synchronize npm packages.',
      },
      delay: 0,
    });

    // Sync types
    const syncTypes = [
      {
        label: 'Changes Feed',
        sublabel: 'every 2 min',
        tooltip: {
          title: 'Changes Feed Sync',
          description: 'Monitors npm _changes endpoint for real-time package updates.',
        },
      },
      {
        label: 'Keyword Search',
        sublabel: 'every 15 min',
        tooltip: {
          title: 'Keyword Search',
          description: 'Searches npm for packages with "tpmjs" keyword. Catches any missed.',
        },
      },
      {
        label: 'Metrics Sync',
        sublabel: 'hourly',
        tooltip: {
          title: 'Metrics Sync',
          description: 'Updates download counts and calculates quality scores.',
        },
      },
    ];

    syncTypes.forEach((sync, i) => {
      drawNode(mainGroup, leftX, topY + 80 + i * 48, 130, 40, {
        label: sync.label,
        sublabel: sync.sublabel,
        type: 'neutral',
        tooltip: sync.tooltip,
        delay: 50 + i * 40,
      });
    });

    // === Validation (center top) ===
    drawNode(mainGroup, centerX, topY + 30, 160, 60, {
      label: 'Schema Validation',
      sublabel: 'Zod + TPMJS Spec',
      type: 'primary',
      tooltip: {
        title: 'Schema Validation',
        description:
          'Validates package.json tpmjs field against specification. Invalid packages rejected.',
      },
      delay: 200,
    });

    // Validation steps
    const validationSteps = [
      {
        label: 'Parse metadata',
        tooltip: {
          title: 'Parse Metadata',
          description: 'Extract tpmjs field and validate structure.',
        },
      },
      {
        label: 'Import package',
        tooltip: {
          title: 'Import Package',
          description: 'Dynamically import via esm.sh to verify it loads.',
        },
      },
      {
        label: 'Extract schemas',
        tooltip: {
          title: 'Extract Schemas',
          description: 'Automatically extract Zod schemas from tool exports.',
        },
      },
    ];

    validationSteps.forEach((step, i) => {
      drawNode(mainGroup, centerX, topY + 110 + i * 44, 125, 36, {
        label: step.label,
        type: 'neutral',
        tooltip: step.tooltip,
        delay: 250 + i * 40,
      });
    });

    // === Database (center bottom) ===
    drawNode(mainGroup, centerX, bottomY - 55, 160, 60, {
      label: 'PostgreSQL',
      sublabel: 'Neon Database',
      type: 'success',
      tooltip: {
        title: 'PostgreSQL Database',
        description:
          'Hosted on Neon with connection pooling. Stores tool metadata, health status, logs.',
      },
      delay: 400,
    });

    // Database tables
    const tables = ['Tool', 'Package', 'SyncLog'];
    tables.forEach((table, i) => {
      const x = centerX - 70 + i * 70;
      drawNode(mainGroup, x, bottomY, 60, 30, {
        label: table,
        type: 'neutral',
        tooltip: {
          title: `${table} Table`,
          description: `Stores ${table.toLowerCase()} records in the registry database.`,
        },
        delay: 450 + i * 30,
      });
    });

    // === Quality Score (right top) ===
    drawNode(mainGroup, rightX, topY + 40, 150, 60, {
      label: 'Quality Score',
      sublabel: '0.00 - 1.00',
      type: 'warning',
      tooltip: {
        title: 'Quality Score',
        description: 'Calculated from metadata tier, npm downloads, and GitHub stars.',
      },
      delay: 500,
    });

    // Score components
    const scoreComponents = [
      {
        label: 'Tier (60%)',
        tooltip: {
          title: 'Metadata Tier',
          description: 'Rich metadata = 0.6, Minimal = 0.4 base score.',
        },
      },
      {
        label: 'Downloads (30%)',
        tooltip: {
          title: 'npm Downloads',
          description: 'Logarithmic scale of monthly downloads, max 0.3.',
        },
      },
      {
        label: 'Stars (10%)',
        tooltip: { title: 'GitHub Stars', description: 'Logarithmic scale of stars, max 0.1.' },
      },
    ];

    scoreComponents.forEach((comp, i) => {
      drawNode(mainGroup, rightX, topY + 120 + i * 42, 110, 34, {
        label: comp.label,
        type: 'neutral',
        tooltip: comp.tooltip,
        delay: 550 + i * 30,
      });
    });

    // === REST API (right bottom) ===
    drawNode(mainGroup, rightX, bottomY - 40, 140, 60, {
      label: 'REST API',
      sublabel: '/api/tools',
      type: 'primary',
      tooltip: {
        title: 'REST API',
        description: 'Public API for searching and retrieving tool metadata.',
      },
      delay: 650,
    });

    // === Connections ===
    // Sync workers to validation
    drawConnection(mainGroup, leftX + 75, topY + 60, centerX - 80, topY + 30, {
      animated: true,
      delay: 700,
    });

    // Sync to details
    drawConnection(mainGroup, leftX, topY + 60, leftX, topY + 56 + 80, {
      animated: true,
      dashed: true,
      delay: 720,
    });

    // Validation to steps
    drawConnection(mainGroup, centerX, topY + 60, centerX, topY + 92, {
      animated: true,
      dashed: true,
      delay: 740,
    });

    // Validation to database
    drawConnection(mainGroup, centerX, topY + 110 + 2 * 44 + 18, centerX, bottomY - 85, {
      label: 'store',
      animated: true,
      delay: 760,
    });

    // Database to tables
    drawConnection(mainGroup, centerX, bottomY - 25, centerX, bottomY - 15, {
      animated: true,
      dashed: true,
      delay: 780,
    });

    // Validation to quality score
    drawConnection(mainGroup, centerX + 80, topY + 40, rightX - 75, topY + 40, {
      animated: true,
      delay: 800,
    });

    // Quality to components
    drawConnection(mainGroup, rightX, topY + 70, rightX, topY + 103, {
      animated: true,
      dashed: true,
      delay: 820,
    });

    // Database to API
    drawConnection(mainGroup, centerX + 80, bottomY - 55, rightX - 70, bottomY - 45, {
      label: 'query',
      animated: true,
      delay: 840,
    });

    // Quality to API
    drawConnection(mainGroup, rightX, topY + 120 + 2 * 42 + 17, rightX, bottomY - 70, {
      animated: true,
      delay: 860,
    });
  }, [dimensions, mounted, setupSvg, drawConnection, drawNode]);

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
        aria-label="TPMJS Platform sync pipeline diagram"
      />
      <div
        ref={tooltipRef}
        className="absolute z-50 px-3 py-2 bg-background border border-border rounded-lg shadow-lg max-w-xs pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0, visibility: 'hidden' }}
      />
    </div>
  );
}
