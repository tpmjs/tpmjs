'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { PROVIDER_MODELS, SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { Modal } from '@tpmjs/ui/Modal/Modal';
import { Select } from '@tpmjs/ui/Select/Select';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { useCallback, useState } from 'react';

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

export interface AgentSettings {
  name: string;
  provider: AIProvider;
  modelId: string;
  systemPrompt: string | null;
  temperature: number;
  maxToolCallsPerTurn: number;
  maxMessagesInContext: number;
}

interface ChatSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  agentId: string;
  settings: AgentSettings;
  onSettingsChange: (settings: AgentSettings) => void;
}

export function ChatSettingsDrawer({
  open,
  onClose,
  agentId,
  settings,
  onSettingsChange,
}: ChatSettingsDrawerProps) {
  const [formData, setFormData] = useState<AgentSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync formData when settings prop changes
  const syncFormData = useCallback(() => {
    setFormData(settings);
  }, [settings]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync form when modal opens
  useState(() => {
    if (open) syncFormData();
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset model when provider changes
      if (name === 'provider') {
        const provider = value as AIProvider;
        const models = PROVIDER_MODELS[provider];
        newData.modelId = models?.[0]?.id || '';
      }

      return newData;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.provider,
          modelId: formData.modelId,
          systemPrompt: formData.systemPrompt || null,
          temperature: Number.parseFloat(formData.temperature.toString()),
          maxToolCallsPerTurn: Number.parseInt(formData.maxToolCallsPerTurn.toString(), 10),
          maxMessagesInContext: Number.parseInt(formData.maxMessagesInContext.toString(), 10),
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSettingsChange(formData);
        onClose();
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const models = PROVIDER_MODELS[formData.provider] || [];

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* header */}
      <div className="flex items-center justify-between p-6 border-b border-dashed border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
            <Icon icon="edit" size="sm" className="text-foreground-secondary" />
          </div>
          <div>
            <h2 className="font-mono text-lg text-foreground lowercase">agent settings</h2>
            <p className="text-sm text-foreground-tertiary">{settings.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded hover:bg-surface-secondary text-foreground-tertiary hover:text-foreground transition-colors"
        >
          <Icon icon="x" size="sm" />
        </button>
      </div>

      {/* content */}
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* model configuration */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            model configuration
          </legend>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="provider" className="font-mono text-xs lowercase">
                  provider
                </Label>
                <Select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  options={SUPPORTED_PROVIDERS.map((p) => ({
                    value: p,
                    label: PROVIDER_DISPLAY_NAMES[p],
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="modelId" className="font-mono text-xs lowercase">
                  model
                </Label>
                <Select
                  id="modelId"
                  name="modelId"
                  value={formData.modelId}
                  onChange={handleChange}
                  options={models.map((m) => ({ value: m.id, label: m.name }))}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* behavior */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            behavior
          </legend>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="temperature" className="font-mono text-xs lowercase">
                  temperature
                </Label>
                <Input
                  type="number"
                  id="temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>
              <div>
                <Label htmlFor="maxToolCallsPerTurn" className="font-mono text-xs lowercase">
                  max tool calls
                </Label>
                <Input
                  type="number"
                  id="maxToolCallsPerTurn"
                  name="maxToolCallsPerTurn"
                  value={formData.maxToolCallsPerTurn}
                  onChange={handleChange}
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <Label htmlFor="maxMessagesInContext" className="font-mono text-xs lowercase">
                  context messages
                </Label>
                <Input
                  type="number"
                  id="maxMessagesInContext"
                  name="maxMessagesInContext"
                  value={formData.maxMessagesInContext}
                  onChange={handleChange}
                  min={1}
                  max={100}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* system prompt */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            system prompt
          </legend>
          <Textarea
            id="systemPrompt"
            name="systemPrompt"
            value={formData.systemPrompt || ''}
            onChange={handleChange}
            rows={8}
            resize="none"
            placeholder="Instructions for the agent..."
            className="font-mono text-sm"
          />
        </fieldset>

        {/* error message */}
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-end gap-2 p-4 border-t border-dashed border-border bg-surface-secondary/30">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Icon icon="loader" size="xs" className="mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </Modal>
  );
}
