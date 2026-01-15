'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import {
  Card,
  CardContent,
} from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { DoDontCard, FieldsetSection, SubSection } from './shared';

export function SectionContent(): React.ReactElement {
  return (
    <FieldsetSection title="8. content guidelines" id="content">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Voice and tone guidelines for consistent, helpful communication
        across the platform.
      </p>

      <SubSection title="voice & tone">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface p-6 border-2 border-success">
            <h4 className="font-mono text-sm font-medium mb-4 text-success">we are</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• <strong>Technical:</strong> Precise, accurate, developer-friendly</li>
              <li>• <strong>Direct:</strong> Say what needs to be said, no fluff</li>
              <li>• <strong>Helpful:</strong> Guide users to success</li>
              <li>• <strong>Neutral:</strong> Professional, not corporate</li>
            </ul>
          </div>
          <div className="bg-surface p-6 border-2 border-error">
            <h4 className="font-mono text-sm font-medium mb-4 text-error">we are not</h4>
            <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
              <li>• <strong>Marketing-speak:</strong> No "revolutionary" or "game-changing"</li>
              <li>• <strong>Cute:</strong> No jokes, puns, or playful language</li>
              <li>• <strong>Vague:</strong> No "something went wrong"</li>
              <li>• <strong>Condescending:</strong> No "simply" or "just"</li>
            </ul>
          </div>
        </div>
      </SubSection>

      <SubSection title="microcopy rules">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DoDontCard type="do" title="Use action verbs for buttons">
              <div className="flex gap-3">
                <Button size="sm">publish</Button>
                <Button size="sm" variant="secondary">save draft</Button>
                <Button size="sm" variant="destructive">delete</Button>
              </div>
            </DoDontCard>
            <DoDontCard type="dont" title="Avoid generic labels">
              <div className="flex gap-3">
                <Button size="sm">submit</Button>
                <Button size="sm" variant="secondary">ok</Button>
                <Button size="sm" variant="destructive">yes</Button>
              </div>
            </DoDontCard>
          </div>

          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">error message format</h4>
            <p className="font-sans text-sm text-foreground-secondary mb-4">
              Error messages should explain <strong>what happened</strong> and
              <strong> what to do next</strong>.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-error-light border border-error text-sm">
                <strong>Good:</strong> "API key is invalid. Generate a new key in your dashboard settings."
              </div>
              <div className="p-3 bg-error-light border border-error text-sm">
                <strong>Bad:</strong> "Error: Invalid credentials"
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="empty states">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="outline">
            <CardContent className="text-center py-12">
              <Icon icon="folder" size="lg" className="text-foreground-tertiary mx-auto mb-4" />
              <p className="font-mono text-sm text-foreground mb-2">no tools yet</p>
              <p className="font-sans text-xs text-foreground-secondary mb-4">
                Publish your first tool to get started.
              </p>
              <Button size="sm">publish tool</Button>
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardContent className="text-center py-12">
              <Icon icon="search" size="lg" className="text-foreground-tertiary mx-auto mb-4" />
              <p className="font-mono text-sm text-foreground mb-2">no results found</p>
              <p className="font-sans text-xs text-foreground-secondary mb-4">
                Try adjusting your search or filters.
              </p>
              <Button size="sm" variant="outline">clear filters</Button>
            </CardContent>
          </Card>

          <Card variant="outline">
            <CardContent className="text-center py-12">
              <Icon icon="alertCircle" size="lg" className="text-error mx-auto mb-4" />
              <p className="font-mono text-sm text-foreground mb-2">failed to load</p>
              <p className="font-sans text-xs text-foreground-secondary mb-4">
                Check your connection and try again.
              </p>
              <Button size="sm" variant="outline">retry</Button>
            </CardContent>
          </Card>
        </div>
      </SubSection>

      <SubSection title="loading states">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">skeleton loading</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Use for content that will load quickly (&lt;2s).
            </p>
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-1/2" />
              <div className="h-4 bg-muted animate-pulse w-5/6" />
            </div>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">spinner loading</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Use for actions or longer operations.
            </p>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <span className="font-mono text-sm text-foreground-secondary">publishing tool...</span>
            </div>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}
