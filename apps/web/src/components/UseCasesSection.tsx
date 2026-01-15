'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useState } from 'react';

interface UseCaseToolStep {
  toolName: string;
  packageName: string;
  purpose: string;
  order: number;
}

interface UseCase {
  id: string;
  userPrompt: string;
  description: string;
  toolSequence: UseCaseToolStep[];
}

interface UseCasesSectionProps {
  collectionId: string;
  useCases: UseCase[] | null;
  generatedAt: string | null;
  onUseCasesGenerated?: (useCases: UseCase[], generatedAt: string) => void;
}

export function UseCasesSection({
  collectionId,
  useCases,
  generatedAt,
  onUseCasesGenerated,
}: UseCasesSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/collections/${collectionId}/use-cases/generate`, {
        method: 'POST',
      });

      if (response.status === 429) {
        const data = await response.json();
        setError(`Rate limited. Try again in ${Math.ceil(data.retryAfter / 60)} minute(s).`);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to generate use cases');
      }

      const data = await response.json();
      onUseCasesGenerated?.(data.data.useCases, data.data.generatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate use cases');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Icon icon="star" className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Example Use Cases</h2>
        </div>
        {useCases && useCases.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Icon icon="loader" className="w-4 h-4 mr-1.5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Icon icon="loader" className="w-4 h-4 mr-1.5" />
                Regenerate
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {!useCases || useCases.length === 0 ? (
        <div className="p-6 bg-surface border border-border rounded-xl text-center">
          {isGenerating ? (
            <div className="space-y-3">
              <Icon icon="loader" className="w-8 h-8 mx-auto text-primary animate-spin" />
              <p className="text-foreground-secondary">Generating use cases with AI...</p>
              <p className="text-xs text-foreground-tertiary">This may take a few seconds</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Icon icon="star" className="w-8 h-8 mx-auto text-foreground-tertiary" />
              <p className="text-foreground-secondary">See how these tools can work together</p>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                <Icon icon="star" className="w-4 h-4 mr-1.5" />
                Suggest Use Cases
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {useCases.map((useCase) => (
            <div
              key={useCase.id}
              className="p-4 bg-surface border border-border rounded-xl space-y-3"
            >
              {/* User Prompt */}
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                  <Icon icon="message" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-foreground-tertiary mb-1">Example prompt:</p>
                  <p className="text-foreground font-medium">&ldquo;{useCase.userPrompt}&rdquo;</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-foreground-secondary pl-9">{useCase.description}</p>

              {/* Tool Sequence */}
              <div className="pl-9">
                <p className="text-xs text-foreground-tertiary mb-2">Tool workflow:</p>
                <div className="flex flex-wrap items-center gap-2">
                  {useCase.toolSequence
                    .sort((a, b) => a.order - b.order)
                    .map((step, index) => (
                      <div key={`${useCase.id}-${step.order}`} className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs" title={step.purpose}>
                          <span className="text-foreground-tertiary mr-1">{step.order}.</span>
                          {step.toolName}
                        </Badge>
                        {index < useCase.toolSequence.length - 1 && (
                          <Icon icon="chevronRight" className="w-3 h-3 text-foreground-tertiary" />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}

          {generatedAt && (
            <p className="text-xs text-foreground-tertiary text-center">
              Generated {new Date(generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
