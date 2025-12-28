'use client';

/**
 * ArchitectureDiagram Component
 *
 * SVG diagram showing TPMJS system architecture with animated flow paths.
 * Replaces ASCII art with a clean, themed visual.
 */

export function ArchitectureDiagram(): React.ReactElement {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <svg
        viewBox="0 0 800 680"
        className="w-full h-auto"
        role="img"
        aria-label="TPMJS System Architecture diagram showing data flow from NPM Registry to Frontend UI"
      >
        {/* Definitions */}
        <defs>
          <marker
            id="arch-arrow"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--brutalist-accent))" />
          </marker>
          <marker
            id="arch-arrow-subtle"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 8 2.5, 0 5" fill="hsl(var(--foreground-secondary))" />
          </marker>
        </defs>

        {/* NPM Registry (Top) */}
        <g id="npm-registry">
          <rect
            x="200"
            y="20"
            width="400"
            height="50"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            rx="0"
          />
          <text
            x="400"
            y="50"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="16"
            fontFamily="monospace"
            fontWeight="700"
          >
            NPM Registry
          </text>
        </g>

        {/* Arrows from NPM to three sources */}
        <path
          d="M 300 70 L 150 120"
          stroke="hsl(var(--foreground-secondary))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow-subtle)"
        />
        <path
          d="M 400 70 L 400 120"
          stroke="hsl(var(--foreground-secondary))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow-subtle)"
        />
        <path
          d="M 500 70 L 650 120"
          stroke="hsl(var(--foreground-secondary))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow-subtle)"
        />

        {/* Three Discovery Sources */}
        <g id="changes-feed">
          <rect
            x="50"
            y="120"
            width="200"
            height="60"
            fill="hsl(var(--brutalist-accent) / 0.1)"
            stroke="hsl(var(--brutalist-accent))"
            strokeWidth="2"
          />
          <text
            x="150"
            y="145"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Changes Feed
          </text>
          <text
            x="150"
            y="165"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Every 2 min
          </text>
        </g>

        <g id="keyword-search">
          <rect
            x="300"
            y="120"
            width="200"
            height="60"
            fill="hsl(var(--brutalist-accent) / 0.1)"
            stroke="hsl(var(--brutalist-accent))"
            strokeWidth="2"
          />
          <text
            x="400"
            y="145"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Keyword Search
          </text>
          <text
            x="400"
            y="165"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Every 15 min
          </text>
        </g>

        <g id="manual-tools">
          <rect
            x="550"
            y="120"
            width="200"
            height="60"
            fill="hsl(var(--brutalist-accent) / 0.1)"
            stroke="hsl(var(--brutalist-accent))"
            strokeWidth="2"
          />
          <text
            x="650"
            y="145"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Manual Tools
          </text>
          <text
            x="650"
            y="165"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            As needed
          </text>
        </g>

        {/* Arrows converging to Validation */}
        <path
          d="M 150 180 L 150 210 L 400 210 L 400 240"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
          strokeDasharray="200"
          strokeDashoffset="-200"
          style={{ animation: 'archFlow 4s infinite' }}
        />
        <path
          d="M 400 180 L 400 240"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
          strokeDasharray="60"
          strokeDashoffset="-60"
          style={{ animation: 'archFlow 4s 0.2s infinite' }}
        />
        <path
          d="M 650 180 L 650 210 L 400 210 L 400 240"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          strokeDasharray="200"
          strokeDashoffset="-200"
          style={{ animation: 'archFlow 4s 0.4s infinite' }}
        />

        {/* Validation */}
        <g id="validation">
          <rect
            x="300"
            y="240"
            width="200"
            height="60"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <text
            x="400"
            y="265"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Validation
          </text>
          <text
            x="400"
            y="285"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Schema Check
          </text>
        </g>

        {/* Arrow from Validation splitting */}
        <path
          d="M 400 300 L 400 330"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 400 330 L 250 330 L 250 360"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />
        <path
          d="M 400 330 L 550 330 L 550 360"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />

        {/* Database and Health Checks */}
        <g id="database">
          <rect
            x="150"
            y="360"
            width="200"
            height="60"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="3"
          />
          <text
            x="250"
            y="385"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            PostgreSQL
          </text>
          <text
            x="250"
            y="405"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Database
          </text>
        </g>

        <g id="health-checks">
          <rect
            x="450"
            y="360"
            width="200"
            height="60"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <text
            x="550"
            y="385"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Health Checks
          </text>
          <text
            x="550"
            y="405"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Import + Execution
          </text>
        </g>

        {/* Arrows converging to Metrics */}
        <path
          d="M 250 420 L 250 450 L 400 450 L 400 470"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />
        <path
          d="M 550 420 L 550 450 L 400 450 L 400 470"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
        />

        {/* Metrics Sync */}
        <g id="metrics">
          <rect
            x="275"
            y="470"
            width="250"
            height="60"
            fill="hsl(var(--brutalist-accent) / 0.1)"
            stroke="hsl(var(--brutalist-accent))"
            strokeWidth="2"
          />
          <text
            x="400"
            y="495"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="14"
            fontFamily="monospace"
            fontWeight="600"
          >
            Metrics Sync + Quality Score
          </text>
          <text
            x="400"
            y="515"
            fill="hsl(var(--foreground-secondary))"
            textAnchor="middle"
            fontSize="12"
            fontFamily="monospace"
          >
            Every hour
          </text>
        </g>

        {/* Arrow from Metrics splitting to APIs */}
        <path
          d="M 400 530 L 400 550"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 400 550 L 250 550 L 250 570"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />
        <path
          d="M 400 550 L 550 550 L 550 570"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />

        {/* API Endpoints */}
        <g id="search-api">
          <rect
            x="150"
            y="570"
            width="200"
            height="50"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <text
            x="250"
            y="592"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="13"
            fontFamily="monospace"
            fontWeight="600"
          >
            Search API
          </text>
          <text
            x="250"
            y="610"
            fill="hsl(var(--foreground-tertiary))"
            textAnchor="middle"
            fontSize="11"
            fontFamily="monospace"
          >
            /api/tools
          </text>
        </g>

        <g id="execution-api">
          <rect
            x="450"
            y="570"
            width="200"
            height="50"
            fill="hsl(var(--surface))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <text
            x="550"
            y="592"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            fontSize="13"
            fontFamily="monospace"
            fontWeight="600"
          >
            Execution API
          </text>
          <text
            x="550"
            y="610"
            fill="hsl(var(--foreground-tertiary))"
            textAnchor="middle"
            fontSize="11"
            fontFamily="monospace"
          >
            /api/tools/execute
          </text>
        </g>

        {/* Arrows to Frontend */}
        <path
          d="M 250 620 L 250 640 L 400 640 L 400 650"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arch-arrow)"
        />
        <path
          d="M 550 620 L 550 640 L 400 640"
          stroke="hsl(var(--brutalist-accent))"
          strokeWidth="2"
          fill="none"
        />

        {/* Frontend UI */}
        <g id="frontend">
          <rect
            x="250"
            y="650"
            width="300"
            height="30"
            fill="hsl(var(--foreground))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <text
            x="400"
            y="670"
            fill="hsl(var(--background))"
            textAnchor="middle"
            fontSize="13"
            fontFamily="monospace"
            fontWeight="700"
          >
            Frontend UI: Search, Detail, Playground
          </text>
        </g>

        {/* Animations */}
        <style>
          {`
            @keyframes archFlow {
              0% { stroke-dashoffset: 200; }
              50% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: 0; }
            }
          `}
        </style>
      </svg>
    </div>
  );
}
