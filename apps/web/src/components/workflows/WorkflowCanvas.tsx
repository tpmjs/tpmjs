'use client';

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataEdge } from './edges/DataEdge';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import { NodeInspector } from './NodeInspector';
import { NodePalette } from './NodePalette';
import { AgentNode } from './nodes/AgentNode';
import { ConditionNode } from './nodes/ConditionNode';
import { LoopNode } from './nodes/LoopNode';
import { NoteNode } from './nodes/NoteNode';
import { OutputNode } from './nodes/OutputNode';
import { ToolNode } from './nodes/ToolNode';
import { TransformNode } from './nodes/TransformNode';
import { TriggerNode } from './nodes/TriggerNode';
import { WorkflowRunsTab } from './WorkflowRunsTab';
import { WorkflowToolbar } from './WorkflowToolbar';

const nodeTypes = {
  TRIGGER: TriggerNode,
  TOOL: ToolNode,
  AGENT: AgentNode,
  CONDITION: ConditionNode,
  LOOP: LoopNode,
  TRANSFORM: TransformNode,
  OUTPUT: OutputNode,
  NOTE: NoteNode,
};

const edgeTypes = {
  data: DataEdge,
};

interface WorkflowData {
  id: string;
  name: string;
  status: string;
  triggerType: string;
  canvasViewport?: { x: number; y: number; zoom: number } | null;
  nodes: Array<{
    id: string;
    nodeId: string;
    type: string;
    label: string;
    positionX: number;
    positionY: number;
    config: Record<string, unknown> | null;
    toolId: string | null;
    agentId: string | null;
    tool?: Record<string, unknown> | null;
    agent?: Record<string, unknown> | null;
  }>;
  edges: Array<{
    id: string;
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle: string | null;
    targetHandle: string | null;
    dataMapping: Record<string, unknown> | null;
    sourceNode?: { nodeId: string };
    targetNode?: { nodeId: string };
  }>;
}

interface WorkflowCanvasProps {
  workflowId: string;
}

export function WorkflowCanvas({ workflowId }: WorkflowCanvasProps): React.ReactElement {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'runs'>('canvas');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);

  const { isRunning, nodeStatuses, runWorkflow } = useWorkflowExecution(workflowId);
  const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo();

  // Load workflow data
  useEffect(() => {
    fetch(`/api/workflows/${workflowId}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const wf = result.data;
          setWorkflow(wf);

          // Build a map from DB node ID to React Flow nodeId
          const dbIdToNodeId = new Map<string, string>();
          for (const node of wf.nodes) {
            dbIdToNodeId.set(node.id, node.nodeId);
          }

          // Convert DB nodes to React Flow nodes
          const rfNodes: Node[] = wf.nodes.map((n: WorkflowData['nodes'][0]) => ({
            id: n.nodeId,
            type: n.type,
            position: { x: n.positionX, y: n.positionY },
            data: {
              label: n.label,
              nodeType: n.type,
              config: n.config,
              toolId: n.toolId,
              agentId: n.agentId,
              tool: n.tool,
              agent: n.agent,
              triggerType: n.type === 'TRIGGER' ? wf.triggerType : undefined,
              toolName: n.tool ? (n.tool as Record<string, unknown>).name : undefined,
              packageName: n.tool
                ? ((n.tool as Record<string, unknown>).package as Record<string, unknown>)
                    ?.npmPackageName
                : undefined,
              agentName: n.agent ? (n.agent as Record<string, unknown>).name : undefined,
              modelId: n.agent ? (n.agent as Record<string, unknown>).modelId : undefined,
            },
          }));

          // Convert DB edges to React Flow edges
          const rfEdges: Edge[] = wf.edges.map((e: WorkflowData['edges'][0]) => ({
            id: e.edgeId,
            source: dbIdToNodeId.get(e.sourceNodeId) || e.sourceNodeId,
            target: dbIdToNodeId.get(e.targetNodeId) || e.targetNodeId,
            sourceHandle: e.sourceHandle || undefined,
            targetHandle: e.targetHandle || undefined,
            type: 'data',
            data: { dataMapping: e.dataMapping },
          }));

          setNodes(rfNodes);
          setEdges(rfEdges);

          // Restore viewport
          if (wf.canvasViewport && reactFlowInstance.current) {
            reactFlowInstance.current.setViewport(wf.canvasViewport);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        // Allow initial load to complete before enabling auto-save
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 500);
      });
  }, [workflowId, setNodes, setEdges]);

  // Debounced auto-save
  const saveGraph = useCallback(() => {
    if (isInitialLoadRef.current) return;
    setSaveStatus('saving');

    const currentNodes = nodes.map((n) => {
      const data = n.data as Record<string, unknown>;
      return {
        nodeId: n.id,
        type: data.nodeType as string,
        label: (data.label as string) || n.id,
        positionX: n.position.x,
        positionY: n.position.y,
        config: data.config || null,
        toolId: data.toolId || null,
        agentId: data.agentId || null,
      };
    });

    const currentEdges = edges.map((e) => ({
      edgeId: e.id,
      sourceNodeId: e.source,
      targetNodeId: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      dataMapping: (e.data as Record<string, unknown>)?.dataMapping || null,
    }));

    const viewport = reactFlowInstance.current?.getViewport();

    fetch(`/api/workflows/${workflowId}/graph`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: currentNodes,
        edges: currentEdges,
        canvasViewport: viewport || null,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        setSaveStatus(result.success ? 'saved' : 'error');
      })
      .catch(() => setSaveStatus('error'));
  }, [nodes, edges, workflowId]);

  // Trigger auto-save on changes
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveGraph, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveGraph]);

  // Update node statuses during execution
  useEffect(() => {
    if (nodeStatuses.size === 0) return;
    setNodes((nds) =>
      nds.map((n) => {
        const status = nodeStatuses.get(n.id);
        if (status) {
          return {
            ...n,
            data: { ...n.data, status: status.status },
          };
        }
        return n;
      })
    );
  }, [nodeStatuses, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'data', id: `e-${Date.now()}` }, eds));
      pushState(nodes, edges);
    },
    [setEdges, nodes, edges, pushState]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData('application/workflow-node');
      if (!dataStr || !reactFlowInstance.current) return;

      const item = JSON.parse(dataStr);
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `${item.type.toLowerCase()}_${Date.now()}`;
      const newNode: Node = {
        id: nodeId,
        type: item.type,
        position,
        data: {
          label: item.label,
          nodeType: item.type,
          toolId: item.toolId || undefined,
          agentId: item.agentId || undefined,
          toolName: item.toolId ? item.label : undefined,
          packageName: item.packageName || undefined,
          agentName: item.agentId ? item.label : undefined,
          modelId: item.modelId || undefined,
          triggerType: item.type === 'TRIGGER' ? 'MANUAL' : undefined,
          branches: item.type === 'CONDITION' ? ['true', 'false'] : undefined,
          config: {},
        },
      };

      pushState(nodes, edges);
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, edges, setNodes, pushState]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      pushState(nodes, edges);
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
    },
    [setNodes, nodes, edges, pushState]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      pushState(nodes, edges);
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges, nodes, edges, pushState]
  );

  const handleUndo = useCallback(() => {
    const state = undo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const state = redo();
    if (state) {
      setNodes(state.nodes);
      setEdges(state.edges);
    }
  }, [redo, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const handleRun = useCallback(() => {
    // Clear previous statuses
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'idle' },
      }))
    );
    runWorkflow({});
  }, [runWorkflow, setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const simpleEdges = useMemo(
    () =>
      edges.map((e) => ({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
      })),
    [edges]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-foreground-secondary animate-pulse">Loading workflow...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-error">Workflow not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <WorkflowToolbar
        name={workflow.name}
        status={workflow.status}
        saveStatus={saveStatus}
        isRunning={isRunning}
        activeTab={activeTab}
        onRun={handleRun}
        onTabChange={setActiveTab}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {activeTab === 'canvas' ? (
        <div className="flex-1 flex overflow-hidden">
          <NodePalette
            collapsed={paletteCollapsed}
            onToggle={() => setPaletteCollapsed(!paletteCollapsed)}
          />

          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                if (workflow.canvasViewport) {
                  instance.setViewport(workflow.canvasViewport);
                }
              }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{ type: 'data' }}
              fitView={!workflow.canvasViewport}
              deleteKeyCode={['Backspace', 'Delete']}
              className="bg-background"
            >
              <Background gap={16} size={1} />
              <Controls showInteractive={false} className="!bg-surface !border-border" />
              <MiniMap nodeStrokeWidth={3} className="!bg-surface !border-border" />
            </ReactFlow>
          </div>

          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onDelete={handleNodeDelete}
              onClose={() => setSelectedNodeId(null)}
              nodes={nodes}
              edges={simpleEdges}
            />
          )}
        </div>
      ) : (
        <WorkflowRunsTab workflowId={workflowId} />
      )}
    </div>
  );
}
