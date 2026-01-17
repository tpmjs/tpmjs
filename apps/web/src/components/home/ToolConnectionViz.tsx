'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'tool' | 'agent' | 'hub';
  label: string;
  color: string;
}

interface Connection {
  from: string;
  to: string;
  progress: number;
  active: boolean;
}

export function ToolConnectionViz(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Initialize nodes and connections
  useEffect(() => {
    const tools = [
      { label: 'web-scraper', color: '#3380CC' },
      { label: 'code-exec', color: '#327D52' },
      { label: 'pdf-parse', color: '#D9A020' },
      { label: 'img-gen', color: '#C44545' },
      { label: 'api-call', color: '#3380CC' },
      { label: 'db-query', color: '#327D52' },
    ];

    const agents = [
      { label: 'Claude', color: '#A6592D' },
      { label: 'GPT', color: '#A6592D' },
      { label: 'Agent', color: '#A6592D' },
    ];

    const nodes: Node[] = [];

    // Central hub (TPMJS)
    nodes.push({
      id: 'hub',
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      vx: 0,
      vy: 0,
      type: 'hub',
      label: 'TPMJS',
      color: '#A6592D',
    });

    // Tools on the left
    tools.forEach((tool, i) => {
      const angle = (Math.PI / (tools.length + 1)) * (i + 1) - Math.PI / 2;
      const radius = 150;
      nodes.push({
        id: `tool-${i}`,
        x: dimensions.width / 2 - radius + Math.cos(angle) * 80,
        y: dimensions.height / 2 + Math.sin(angle) * 120,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        type: 'tool',
        label: tool.label,
        color: tool.color,
      });
    });

    // Agents on the right
    agents.forEach((agent, i) => {
      const angle = (Math.PI / (agents.length + 1)) * (i + 1) + Math.PI / 2;
      const radius = 150;
      nodes.push({
        id: `agent-${i}`,
        x: dimensions.width / 2 + radius + Math.cos(angle) * 80,
        y: dimensions.height / 2 + Math.sin(angle) * 80,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        type: 'agent',
        label: agent.label,
        color: agent.color,
      });
    });

    nodesRef.current = nodes;

    // Create connections
    const connections: Connection[] = [];
    tools.forEach((_, i) => {
      connections.push({
        from: `tool-${i}`,
        to: 'hub',
        progress: Math.random(),
        active: Math.random() > 0.5,
      });
    });
    agents.forEach((_, i) => {
      connections.push({
        from: 'hub',
        to: `agent-${i}`,
        progress: Math.random(),
        active: Math.random() > 0.5,
      });
    });
    connectionsRef.current = connections;
  }, [dimensions]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 400 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Update node positions (subtle floating)
      nodes.forEach((node) => {
        if (node.type !== 'hub') {
          node.x += node.vx;
          node.y += node.vy;

          // Bounce off boundaries
          if (node.x < 50 || node.x > dimensions.width - 50) node.vx *= -1;
          if (node.y < 50 || node.y > dimensions.height - 50) node.vy *= -1;

          // Mouse repulsion
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            node.vx -= (dx / dist) * 0.1;
            node.vy -= (dy / dist) * 0.1;
          }

          // Damping
          node.vx *= 0.99;
          node.vy *= 0.99;
        }
      });

      // Draw connections
      connections.forEach((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) return;

        // Update progress
        if (conn.active) {
          conn.progress += 0.01;
          if (conn.progress > 1) {
            conn.progress = 0;
            conn.active = Math.random() > 0.3;
          }
        } else {
          if (Math.random() > 0.995) {
            conn.active = true;
          }
        }

        // Draw line
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = 'rgba(166, 89, 45, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw data packet
        if (conn.active) {
          const packetX = fromNode.x + (toNode.x - fromNode.x) * conn.progress;
          const packetY = fromNode.y + (toNode.y - fromNode.y) * conn.progress;

          ctx.beginPath();
          ctx.arc(packetX, packetY, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#A6592D';
          ctx.fill();

          // Glow effect
          ctx.beginPath();
          ctx.arc(packetX, packetY, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(166, 89, 45, 0.3)';
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        // Node background
        if (node.type === 'hub') {
          // Central hub - larger with glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, 40, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(166, 89, 45, 0.1)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
          ctx.fillStyle = '#A6592D';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(166, 89, 45, 0.5)';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          // Regular nodes
          const size = node.type === 'agent' ? 24 : 20;

          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = node.type === 'hub' ? '#FFFFFF' : '#1a1715';
        if (node.type === 'hub') {
          ctx.font = 'bold 12px monospace';
          ctx.fillText(node.label, node.x, node.y + 4);
        } else {
          ctx.fillText(node.label, node.x, node.y + (node.type === 'agent' ? 40 : 36));
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ height: '400px' }}
      />

      {/* Labels */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-left">
        <span className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider">
          tools
        </span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
        <span className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider">
          agents
        </span>
      </div>
    </div>
  );
}
