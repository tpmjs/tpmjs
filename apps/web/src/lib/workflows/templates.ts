/**
 * Workflow templates - pre-built workflow configurations
 */

export interface WorkflowTemplate {
  name: string;
  description: string;
  triggerType: 'MANUAL' | 'WEBHOOK' | 'SCHEDULE';
  nodes: Array<{
    nodeId: string;
    type: string;
    label: string;
    positionX: number;
    positionY: number;
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    edgeId: string;
    sourceNodeId: string;
    targetNodeId: string;
    sourceHandle: string | null;
    targetHandle: string | null;
  }>;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    name: 'HTTP Request Pipeline',
    description: 'Trigger → Tool → Transform → Output',
    triggerType: 'MANUAL',
    nodes: [
      {
        nodeId: 'trigger-1',
        type: 'TRIGGER',
        label: 'Manual Trigger',
        positionX: 250,
        positionY: 50,
        config: { triggerType: 'MANUAL' },
      },
      {
        nodeId: 'tool-1',
        type: 'TOOL',
        label: 'HTTP Request',
        positionX: 250,
        positionY: 200,
        config: {},
      },
      {
        nodeId: 'transform-1',
        type: 'TRANSFORM',
        label: 'Transform Response',
        positionX: 250,
        positionY: 350,
        config: { mappings: [] },
      },
      {
        nodeId: 'output-1',
        type: 'OUTPUT',
        label: 'Result',
        positionX: 250,
        positionY: 500,
        config: {},
      },
    ],
    edges: [
      {
        edgeId: 'e-trigger-tool',
        sourceNodeId: 'trigger-1',
        targetNodeId: 'tool-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-tool-transform',
        sourceNodeId: 'tool-1',
        targetNodeId: 'transform-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-transform-output',
        sourceNodeId: 'transform-1',
        targetNodeId: 'output-1',
        sourceHandle: null,
        targetHandle: null,
      },
    ],
  },
  {
    name: 'Agent Pipeline',
    description: 'Trigger → Agent → Tool → Output',
    triggerType: 'MANUAL',
    nodes: [
      {
        nodeId: 'trigger-1',
        type: 'TRIGGER',
        label: 'Manual Trigger',
        positionX: 250,
        positionY: 50,
        config: { triggerType: 'MANUAL' },
      },
      {
        nodeId: 'agent-1',
        type: 'AGENT',
        label: 'AI Agent',
        positionX: 250,
        positionY: 200,
        config: { prompt: '' },
      },
      {
        nodeId: 'tool-1',
        type: 'TOOL',
        label: 'Process Result',
        positionX: 250,
        positionY: 350,
        config: {},
      },
      {
        nodeId: 'output-1',
        type: 'OUTPUT',
        label: 'Result',
        positionX: 250,
        positionY: 500,
        config: {},
      },
    ],
    edges: [
      {
        edgeId: 'e-trigger-agent',
        sourceNodeId: 'trigger-1',
        targetNodeId: 'agent-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-agent-tool',
        sourceNodeId: 'agent-1',
        targetNodeId: 'tool-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-tool-output',
        sourceNodeId: 'tool-1',
        targetNodeId: 'output-1',
        sourceHandle: null,
        targetHandle: null,
      },
    ],
  },
  {
    name: 'Conditional Routing',
    description: 'Trigger → Condition → Tool A / Tool B → Output',
    triggerType: 'MANUAL',
    nodes: [
      {
        nodeId: 'trigger-1',
        type: 'TRIGGER',
        label: 'Manual Trigger',
        positionX: 250,
        positionY: 50,
        config: { triggerType: 'MANUAL' },
      },
      {
        nodeId: 'condition-1',
        type: 'CONDITION',
        label: 'Check Condition',
        positionX: 250,
        positionY: 200,
        config: {
          field: '',
          operator: '===',
          value: '',
          branches: [
            { id: 'true', label: 'True' },
            { id: 'false', label: 'False' },
          ],
        },
      },
      {
        nodeId: 'tool-a',
        type: 'TOOL',
        label: 'Tool A (True)',
        positionX: 100,
        positionY: 380,
        config: {},
      },
      {
        nodeId: 'tool-b',
        type: 'TOOL',
        label: 'Tool B (False)',
        positionX: 400,
        positionY: 380,
        config: {},
      },
      {
        nodeId: 'output-1',
        type: 'OUTPUT',
        label: 'Result',
        positionX: 250,
        positionY: 530,
        config: {},
      },
    ],
    edges: [
      {
        edgeId: 'e-trigger-condition',
        sourceNodeId: 'trigger-1',
        targetNodeId: 'condition-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-condition-true',
        sourceNodeId: 'condition-1',
        targetNodeId: 'tool-a',
        sourceHandle: 'true',
        targetHandle: null,
      },
      {
        edgeId: 'e-condition-false',
        sourceNodeId: 'condition-1',
        targetNodeId: 'tool-b',
        sourceHandle: 'false',
        targetHandle: null,
      },
      {
        edgeId: 'e-tool-a-output',
        sourceNodeId: 'tool-a',
        targetNodeId: 'output-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-tool-b-output',
        sourceNodeId: 'tool-b',
        targetNodeId: 'output-1',
        sourceHandle: null,
        targetHandle: null,
      },
    ],
  },
  {
    name: 'Data Processing Loop',
    description: 'Trigger → Tool (fetch) → Loop → Tool (process) → Output',
    triggerType: 'MANUAL',
    nodes: [
      {
        nodeId: 'trigger-1',
        type: 'TRIGGER',
        label: 'Manual Trigger',
        positionX: 250,
        positionY: 50,
        config: { triggerType: 'MANUAL' },
      },
      {
        nodeId: 'tool-fetch',
        type: 'TOOL',
        label: 'Fetch Data',
        positionX: 250,
        positionY: 200,
        config: {},
      },
      {
        nodeId: 'loop-1',
        type: 'LOOP',
        label: 'Loop Over Items',
        positionX: 250,
        positionY: 350,
        config: { arrayPath: '', maxIterations: 100 },
      },
      {
        nodeId: 'tool-process',
        type: 'TOOL',
        label: 'Process Item',
        positionX: 250,
        positionY: 500,
        config: {},
      },
      {
        nodeId: 'output-1',
        type: 'OUTPUT',
        label: 'Results',
        positionX: 250,
        positionY: 650,
        config: {},
      },
    ],
    edges: [
      {
        edgeId: 'e-trigger-fetch',
        sourceNodeId: 'trigger-1',
        targetNodeId: 'tool-fetch',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-fetch-loop',
        sourceNodeId: 'tool-fetch',
        targetNodeId: 'loop-1',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-loop-process',
        sourceNodeId: 'loop-1',
        targetNodeId: 'tool-process',
        sourceHandle: null,
        targetHandle: null,
      },
      {
        edgeId: 'e-process-output',
        sourceNodeId: 'tool-process',
        targetNodeId: 'output-1',
        sourceHandle: null,
        targetHandle: null,
      },
    ],
  },
];
