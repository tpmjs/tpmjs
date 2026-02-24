'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { AppHeader } from '~/components/AppHeader';

const EDITORS = [
  {
    id: 'claude-code' as const,
    name: 'Claude Code',
    description: 'Terminal CLI by Anthropic',
    icon: '>_',
  },
  {
    id: 'cursor' as const,
    name: 'Cursor',
    description: 'AI code editor',
    icon: '{;}',
  },
  {
    id: 'windsurf' as const,
    name: 'Windsurf',
    description: 'Agentic IDE',
    icon: 'W',
  },
  {
    id: 'claude-desktop' as const,
    name: 'Claude Desktop',
    description: 'Desktop app',
    icon: 'C',
  },
] as const;

type EditorId = (typeof EDITORS)[number]['id'];

interface Collection {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  isPublic: boolean;
  toolCount: number;
}

interface Mapping {
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
  editor: EditorId;
}

type Step = 'collections' | 'editors' | 'command';

export default function SetupPage(): React.ReactElement {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const claimCode = searchParams.get('claim');

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());
  const [mappings, setMappings] = useState<Map<string, EditorId>>(new Map());
  const [step, setStep] = useState<Step>('collections');
  const [installCommand, setInstallCommand] = useState('');
  const [apiKeyCreated, setApiKeyCreated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimCompleted, setClaimCompleted] = useState(false);

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collections?limit=50');
      const data = await response.json();
      if (data.success && data.data) {
        setCollections(data.data);
      }
    } catch {
      setError('Failed to load collections');
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCollections();
    }
  }, [session, fetchCollections]);

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setMappings((m) => {
          const nm = new Map(m);
          nm.delete(id);
          return nm;
        });
      } else {
        next.add(id);
        // Default to claude-code
        setMappings((m) => {
          const nm = new Map(m);
          nm.set(id, 'claude-code');
          return nm;
        });
      }
      return next;
    });
  };

  const setEditorForCollection = (collectionId: string, editor: EditorId) => {
    setMappings((m) => {
      const nm = new Map(m);
      nm.set(collectionId, editor);
      return nm;
    });
  };

  const generateInstallCommand = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const mappingPayload: Mapping[] = [];
      for (const id of selectedCollections) {
        const collection = collections.find((c) => c.id === id);
        if (!collection) continue;
        mappingPayload.push({
          collectionId: id,
          collectionSlug: collection.slug || collection.id,
          collectionName: collection.name,
          editor: mappings.get(id) || 'claude-code',
        });
      }

      const response = await fetch('/api/setup/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mappings: mappingPayload,
          createApiKey: true,
          ...(claimCode && { claimCode }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate install command');
      }

      setInstallCommand(data.installCommand);
      if (data.apiKey) {
        setApiKeyCreated(data.apiKey);
      }

      // If this was triggered from install.sh (claim code present),
      // show a completion message instead of a command to copy
      if (claimCode) {
        setClaimCompleted(true);
      }

      setStep('command');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate install command');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCommand = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Not logged in
  if (!isPending && !session?.user) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-background">
          <Container size="md" padding="lg" className="py-24">
            <div className="text-center">
              <div className="w-16 h-16 border border-dashed border-border bg-surface flex items-center justify-center mx-auto mb-6">
                <span className="font-mono text-2xl text-primary">$</span>
              </div>
              <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4 lowercase">
                set up tpmjs
              </h1>
              <p className="text-foreground-secondary mb-8 max-w-lg mx-auto">
                Sign in to select your collections and generate a personalized install command that
                configures your editors automatically.
              </p>
              <Link href="/auth/signin?callbackUrl=/setup">
                <Button size="lg" variant="default">
                  Sign In to Get Started
                </Button>
              </Link>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-background">
        <Container size="lg" padding="lg" className="py-12 md:py-20">
          {/* CLI-initiated banner */}
          {claimCode && !claimCompleted && (
            <div className="mb-8 p-4 border-2 border-primary bg-primary/5 text-center">
              <p className="font-mono text-sm text-foreground">
                Your terminal is waiting. Select your collections and editors below, then click
                generate — your terminal will pick up the configuration automatically.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
              one command setup
            </p>
            <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4 lowercase">
              connect tpmjs to your editor
            </h1>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              Select collections, choose your editors, and get a single command that configures
              everything.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-12 font-mono text-sm">
            {(['collections', 'editors', 'command'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`w-8 h-px ${step === s || (['editors', 'command'].indexOf(step) > ['editors', 'command'].indexOf(s) ? true : false) ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (s === 'collections') setStep('collections');
                    else if (s === 'editors' && selectedCollections.size > 0) setStep('editors');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 border transition-colors ${
                    step === s
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-border text-foreground-tertiary hover:text-foreground-secondary'
                  }`}
                >
                  <span className="w-5 h-5 border border-current flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline lowercase">{s}</span>
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-8 p-4 border border-error/30 bg-error/5 text-error text-sm font-mono">
              {error}
            </div>
          )}

          {/* Step 1: Select Collections */}
          {step === 'collections' && (
            <div>
              <fieldset className="border border-dashed border-border p-6 md:p-8">
                <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                  select collections
                </legend>

                {isPending || isLoadingCollections ? (
                  <div className="text-center py-12 text-foreground-tertiary font-mono text-sm">
                    Loading collections...
                  </div>
                ) : collections.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-foreground-secondary mb-4">
                      You don&apos;t have any collections yet.
                    </p>
                    <Link href="/dashboard/collections">
                      <Button variant="default">Create a Collection</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {collections.map((collection) => {
                      const isSelected = selectedCollections.has(collection.id);
                      return (
                        <button
                          key={collection.id}
                          type="button"
                          onClick={() => toggleCollection(collection.id)}
                          className={`text-left p-4 border transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border bg-surface hover:border-foreground-tertiary'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-mono text-sm font-semibold text-foreground">
                              {collection.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {collection.isPublic ? (
                                <Badge variant="outline" size="sm">
                                  public
                                </Badge>
                              ) : (
                                <Badge variant="secondary" size="sm">
                                  private
                                </Badge>
                              )}
                              <div
                                className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border'
                                }`}
                              >
                                {isSelected && <Icon icon="check" className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                          {collection.description && (
                            <p className="text-xs text-foreground-secondary line-clamp-2 mb-2">
                              {collection.description}
                            </p>
                          )}
                          <span className="font-mono text-xs text-foreground-tertiary">
                            {collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <div className="flex justify-end mt-6">
                <Button
                  size="lg"
                  variant="default"
                  onClick={() => setStep('editors')}
                  disabled={selectedCollections.size === 0}
                >
                  Choose Editors ({selectedCollections.size} selected)
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Map Collections to Editors */}
          {step === 'editors' && (
            <div>
              <fieldset className="border border-dashed border-border p-6 md:p-8">
                <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                  assign editors
                </legend>

                <div className="space-y-4">
                  {Array.from(selectedCollections).map((collectionId) => {
                    const collection = collections.find((c) => c.id === collectionId);
                    if (!collection) return null;
                    const currentEditor = mappings.get(collectionId) || 'claude-code';

                    return (
                      <div key={collectionId} className="p-4 border border-border bg-surface">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-mono text-sm font-semibold text-foreground">
                              {collection.name}
                            </h3>
                            <span className="font-mono text-xs text-foreground-tertiary">
                              {collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Icon icon="arrowRight" className="w-4 h-4 text-foreground-tertiary" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {EDITORS.map((editor) => (
                            <button
                              key={editor.id}
                              type="button"
                              onClick={() => setEditorForCollection(collectionId, editor.id)}
                              className={`p-3 border text-center transition-all ${
                                currentEditor === editor.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                  : 'border-border hover:border-foreground-tertiary'
                              }`}
                            >
                              <div className="font-mono text-lg mb-1">{editor.icon}</div>
                              <div className="font-mono text-xs font-medium text-foreground">
                                {editor.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep('collections')}>
                  Back
                </Button>
                <Button
                  size="lg"
                  variant="default"
                  onClick={generateInstallCommand}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Install Command'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Copy Command or Claim Completed */}
          {step === 'command' && (
            <div>
              <fieldset className="border border-dashed border-border p-6 md:p-8">
                <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                  {claimCompleted ? 'setup complete' : 'your install command'}
                </legend>

                {claimCompleted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon icon="check" className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-mono text-xl font-bold text-foreground mb-2 lowercase">
                      configuration sent to your terminal
                    </h3>
                    <p className="text-sm text-foreground-secondary max-w-md mx-auto">
                      Switch back to your terminal — the install script is picking up your
                      configuration and setting up your editors now.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground-secondary mb-6">
                      Run this in your terminal to configure all selected editors. The token expires
                      in 1 hour and can only be used once.
                    </p>

                    <div className="relative">
                      <div className="p-4 bg-background border border-border font-mono text-sm overflow-x-auto">
                        <code className="text-foreground break-all">{installCommand}</code>
                      </div>
                      <button
                        type="button"
                        onClick={copyCommand}
                        className="absolute top-3 right-3 p-2 text-foreground-tertiary hover:text-foreground transition-colors border border-border bg-surface"
                      >
                        <Icon icon={copied ? 'check' : 'copy'} size="xs" />
                      </button>
                    </div>
                  </>
                )}

                {apiKeyCreated && (
                  <div className="mt-4 p-4 border border-dashed border-primary/30 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <Icon icon="key" size="sm" className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-mono text-xs font-medium text-foreground mb-1 lowercase">
                          api key auto-created
                        </p>
                        <p className="font-mono text-xs text-foreground-secondary">
                          A TPMJS API key was created for authentication. It&apos;s embedded in the
                          setup token and will be configured in your editors automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="mt-6 p-4 border border-border bg-surface">
                  <h3 className="font-mono text-sm font-medium text-foreground mb-3 lowercase">
                    what this will configure
                  </h3>
                  <div className="space-y-2">
                    {Array.from(selectedCollections).map((collectionId) => {
                      const collection = collections.find((c) => c.id === collectionId);
                      const editor = EDITORS.find((e) => e.id === mappings.get(collectionId));
                      if (!collection || !editor) return null;
                      return (
                        <div
                          key={collectionId}
                          className="flex items-center gap-3 font-mono text-xs"
                        >
                          <span className="text-foreground">{collection.name}</span>
                          <span className="text-foreground-tertiary">→</span>
                          <span className="text-primary">{editor.name}</span>
                          <span className="text-foreground-tertiary">
                            ({collection.toolCount} tool{collection.toolCount !== 1 ? 's' : ''})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-between mt-6">
                {claimCompleted ? (
                  <div />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('editors');
                      setInstallCommand('');
                      setApiKeyCreated(null);
                    }}
                  >
                    Back
                  </Button>
                )}
                {!claimCompleted && (
                  <Button variant="outline" onClick={() => copyCommand()}>
                    <Icon icon={copied ? 'check' : 'copy'} size="xs" className="mr-2" />
                    {copied ? 'Copied!' : 'Copy Command'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
