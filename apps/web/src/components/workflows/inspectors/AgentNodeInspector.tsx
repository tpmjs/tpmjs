'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Label } from '@tpmjs/ui/Label/Label';
import { Select } from '@tpmjs/ui/Select/Select';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import type { Node } from '@xyflow/react';
import { useEffect, useState } from 'react';

interface AgentNodeInspectorProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  nodes: Node[];
  edges: Array<{ source: string; target: string; sourceHandle?: string | null }>;
}

interface AgentOption {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
}

export function AgentNodeInspector({
  node,
  onUpdate,
}: AgentNodeInspectorProps): React.ReactElement {
  const data = node.data as Record<string, unknown>;
  const config = (data.config as Record<string, unknown>) || {};
  const agentId = data.agentId as string | undefined;
  const [agents, setAgents] = useState<AgentOption[]>([]);

  useEffect(() => {
    fetch('/api/agents?limit=50')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setAgents(result.data);
      })
      .catch(() => {});
  }, []);

  const selectedAgent = agents.find((a) => a.id === agentId);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const agent = agents.find((a) => a.id === e.target.value);
    onUpdate(node.id, {
      ...data,
      agentId: e.target.value || undefined,
      label: agent?.name || data.label,
      agentName: agent?.name,
      modelId: agent?.modelId,
    });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(node.id, {
      ...data,
      config: { ...config, prompt: e.target.value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="agent-select" className="mb-1 text-xs">
          Agent
        </Label>
        <Select
          id="agent-select"
          value={agentId || ''}
          onChange={handleAgentChange}
          options={[
            { value: '', label: 'Select an agent...' },
            ...agents.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
      </div>

      {selectedAgent && (
        <div className="flex gap-2">
          <Badge variant="outline" size="sm">
            {selectedAgent.provider}
          </Badge>
          <Badge variant="secondary" size="sm">
            {selectedAgent.modelId}
          </Badge>
        </div>
      )}

      <div>
        <Label htmlFor="agent-prompt" className="mb-1 text-xs">
          Prompt Template
        </Label>
        <Textarea
          id="agent-prompt"
          value={(config.prompt as string) || ''}
          onChange={handlePromptChange}
          rows={4}
          resize="none"
          placeholder="Process the following: {{input.data}}"
          className="font-mono text-xs"
        />
        <p className="text-[10px] text-foreground-tertiary mt-1">
          Use {'{{input.field}}'} to reference upstream data.
        </p>
      </div>
    </div>
  );
}
