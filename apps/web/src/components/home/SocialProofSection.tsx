import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';

const mcpClients = ['Claude Code', 'Claude Desktop', 'Cursor', 'Windsurf', 'any MCP client'];

export function SocialProofSection(): React.ReactElement {
  return (
    <section className="py-20 bg-surface border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">why tpmjs</p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            built for real usage
          </h2>
        </div>

        {/* Trust Signals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Works With */}
          <div className="p-6 border border-dashed border-border bg-background">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface">
              <Icon icon="puzzle" size="md" className="text-foreground-secondary" />
            </div>
            <h3 className="font-mono text-lg font-semibold text-foreground lowercase mb-3">
              works with
            </h3>
            <div className="flex flex-wrap gap-2">
              {mcpClients.map((client) => (
                <Badge key={client} variant="outline" size="sm">
                  <span className="font-mono text-xs">{client}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Open Source */}
          <div className="p-6 border border-dashed border-border bg-background">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface">
              <Icon icon="github" size="md" className="text-foreground-secondary" />
            </div>
            <h3 className="font-mono text-lg font-semibold text-foreground lowercase mb-3">
              fully open source
            </h3>
            <p className="font-sans text-sm text-foreground-secondary leading-relaxed mb-4">
              MIT licensed. The registry, executor, CLI, SDK, and this website are all on GitHub.
              Inspect the code, contribute, or self-host.
            </p>
            <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <Icon icon="star" className="w-3.5 h-3.5 mr-1.5" />
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Quality Verified */}
          <div className="p-6 border border-dashed border-border bg-background">
            <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-surface">
              <Icon icon="checkCircle" size="md" className="text-foreground-secondary" />
            </div>
            <h3 className="font-mono text-lg font-semibold text-foreground lowercase mb-3">
              every tool is validated
            </h3>
            <p className="font-sans text-sm text-foreground-secondary leading-relaxed">
              Auto-synced from npm. Schemas extracted. Health checks run continuously. Quality
              scored on docs, downloads, maintenance, and reliability. Broken tools get flagged.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
