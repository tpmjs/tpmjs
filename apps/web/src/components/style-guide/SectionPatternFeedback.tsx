'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { FieldsetSection, SubSection } from './shared';

export function SectionPatternFeedback(): React.ReactElement {
  return (
    <FieldsetSection title="16. feedback patterns" id="feedback-patterns">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Feedback patterns communicate status, progress, and system responses.
        Choose the right pattern based on context and urgency.
      </p>

      <SubSection title="feedback decision tree">
        <div className="bg-surface p-6 border border-dashed border-border mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Badge variant="info" className="mt-1">Q1</Badge>
              <div>
                <p className="font-mono text-sm mb-2">Is this a page-level system message?</p>
                <p className="font-sans text-xs text-foreground-secondary">
                  Yes → Use <strong>Banner</strong> (maintenance, outage, announcement)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge variant="info" className="mt-1">Q2</Badge>
              <div>
                <p className="font-mono text-sm mb-2">Is it a response to a user action?</p>
                <p className="font-sans text-xs text-foreground-secondary">
                  Yes → Use <strong>Toast</strong> (save, submit, delete confirmation)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Badge variant="info" className="mt-1">Q3</Badge>
              <div>
                <p className="font-mono text-sm mb-2">Is it contextual to a specific element?</p>
                <p className="font-sans text-xs text-foreground-secondary">
                  Yes → Use <strong>Inline Alert</strong> (form errors, field hints)
                </p>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="toast notifications">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Ephemeral messages that appear briefly and auto-dismiss.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Success toast */}
          <div className="bg-surface p-4 border-l-4 border-success flex items-start gap-3">
            <Icon icon="check" size="sm" className="text-success mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium">tool published</p>
              <p className="font-sans text-xs text-foreground-secondary">
                @tpmjs/parser v1.0.0 is now live
              </p>
            </div>
          </div>

          {/* Error toast */}
          <div className="bg-surface p-4 border-l-4 border-error flex items-start gap-3">
            <Icon icon="x" size="sm" className="text-error mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium">publish failed</p>
              <p className="font-sans text-xs text-foreground-secondary">
                Package validation errors. Check your config.
              </p>
            </div>
          </div>

          {/* Warning toast */}
          <div className="bg-surface p-4 border-l-4 border-warning flex items-start gap-3">
            <Icon icon="alertTriangle" size="sm" className="text-warning mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium">api rate limit</p>
              <p className="font-sans text-xs text-foreground-secondary">
                You've used 90% of your monthly quota
              </p>
            </div>
          </div>

          {/* Info toast */}
          <div className="bg-surface p-4 border-l-4 border-info flex items-start gap-3">
            <Icon icon="info" size="sm" className="text-info mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium">new version available</p>
              <p className="font-sans text-xs text-foreground-secondary">
                Refresh to get the latest features
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-surface p-4 border border-dashed border-border">
          <h4 className="font-mono text-sm font-medium mb-3">toast guidelines</h4>
          <ul className="space-y-2 text-sm text-foreground-secondary font-sans">
            <li>• Auto-dismiss after 5 seconds (except errors)</li>
            <li>• Errors should require manual dismissal</li>
            <li>• Stack from bottom-right, newest at bottom</li>
            <li>• Maximum 3 visible toasts at once</li>
          </ul>
        </div>
      </SubSection>

      <SubSection title="inline alerts">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Persistent messages within content flow.
        </p>
        <div className="space-y-4">
          <div className="bg-success-light border border-success p-4 flex items-start gap-3">
            <Icon icon="check" size="sm" className="text-success mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium text-success">verification complete</p>
              <p className="font-sans text-xs text-foreground-secondary">
                Your email has been verified. You can now publish tools.
              </p>
            </div>
          </div>

          <div className="bg-warning-light border border-warning p-4 flex items-start gap-3">
            <Icon icon="alertTriangle" size="sm" className="text-warning mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium text-warning">deprecated package</p>
              <p className="font-sans text-xs text-foreground-secondary">
                This package is deprecated. Consider migrating to @tpmjs/v2.
              </p>
            </div>
          </div>

          <div className="bg-error-light border border-error p-4 flex items-start gap-3">
            <Icon icon="alertCircle" size="sm" className="text-error mt-0.5" />
            <div>
              <p className="font-mono text-sm font-medium text-error">critical security issue</p>
              <p className="font-sans text-xs text-foreground-secondary">
                This version has known vulnerabilities. Update immediately.
              </p>
              <Button size="sm" variant="destructive" className="mt-3">update now</Button>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="global banners">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          System-wide announcements that span the full width.
        </p>
        <div className="space-y-4">
          {/* Maintenance banner */}
          <div className="bg-warning text-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="alertTriangle" size="sm" />
              <span className="font-mono text-sm">
                Scheduled maintenance: Jan 15, 2-4am UTC. Some services may be unavailable.
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-warning-light">
              <Icon icon="x" size="sm" />
            </Button>
          </div>

          {/* Outage banner */}
          <div className="bg-error text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="alertCircle" size="sm" />
              <span className="font-mono text-sm">
                Service degradation detected. Some API calls may fail. We are investigating.
              </span>
            </div>
            <a href="#" className="font-mono text-sm underline hover:no-underline">status page</a>
          </div>

          {/* Announcement banner */}
          <div className="bg-accent text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="star" size="sm" />
              <span className="font-mono text-sm">
                New: AI-powered code review is now available for all tools!
              </span>
            </div>
            <Button variant="secondary" size="sm">learn more</Button>
          </div>
        </div>
      </SubSection>

      <SubSection title="progress indicators">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          For long-running operations, show determinate progress when possible.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Determinate progress */}
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">determinate progress</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Use when you can calculate progress (file upload, batch processing).
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span>uploading package.tgz</span>
                <span>67%</span>
              </div>
              <ProgressBar value={67} variant="primary" />
            </div>
          </div>

          {/* Indeterminate progress */}
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">indeterminate progress</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Use when duration is unknown (API calls, processing).
            </p>
            <div className="flex items-center gap-4">
              <Spinner size="sm" />
              <span className="font-mono text-sm text-foreground-secondary">
                validating package...
              </span>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="retry patterns">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          When operations fail, provide clear retry options.
        </p>
        <div className="bg-surface p-6 border border-dashed border-border">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-error-light flex items-center justify-center flex-shrink-0">
              <Icon icon="alertCircle" size="md" className="text-error" />
            </div>
            <div className="flex-1">
              <p className="font-mono text-sm font-medium mb-1">failed to load tools</p>
              <p className="font-sans text-xs text-foreground-secondary mb-4">
                We couldn't connect to the server. This could be a network issue or the service may be temporarily unavailable.
              </p>
              <div className="flex gap-2">
                <Button size="sm">retry</Button>
                <Button size="sm" variant="ghost">view details</Button>
              </div>
            </div>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}
