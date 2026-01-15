'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { Select } from '@tpmjs/ui/Select/Select';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { DoDontCard, FieldsetSection, SubSection } from './shared';

export function SectionPatternForms(): React.ReactElement {
  return (
    <FieldsetSection title="15. form patterns" id="form-patterns">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Consistent form patterns for data entry, validation, and submission.
        Forms should guide users through tasks with clear feedback.
      </p>

      <SubSection title="validation timing">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Choose validation timing based on the field type and user expectations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">validate on blur</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Best for: format validation, required fields
            </p>
            <FormField label="email" error="Please enter a valid email address">
              <Input placeholder="user@example.com" state="error" />
            </FormField>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <h4 className="font-mono text-sm font-medium mb-4">validate on submit</h4>
            <p className="font-sans text-xs text-foreground-secondary mb-4">
              Best for: async validation, complex rules
            </p>
            <FormField label="package name" helperText="We'll check if this name is available">
              <Input placeholder="@scope/package-name" />
            </FormField>
          </div>
        </div>
      </SubSection>

      <SubSection title="error summary">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          For forms with multiple errors, show a summary at the top.
        </p>
        <div className="bg-surface border border-dashed border-border p-6">
          {/* Error summary */}
          <div className="bg-error-light border border-error p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="alertCircle" size="sm" className="text-error" />
              <span className="font-mono text-sm font-medium text-error">please fix 3 errors</span>
            </div>
            <ul className="space-y-1 text-sm text-foreground-secondary font-sans">
              <li><a href="#name" className="text-error hover:underline">Name is required</a></li>
              <li><a href="#email" className="text-error hover:underline">Email format is invalid</a></li>
              <li><a href="#description" className="text-error hover:underline">Description must be at least 50 characters</a></li>
            </ul>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <FormField label="name" error="Name is required" required>
              <Input placeholder="Enter name" state="error" />
            </FormField>
            <FormField label="email" error="Email format is invalid" required>
              <Input placeholder="user@example.com" state="error" />
            </FormField>
            <FormField label="description" error="Description must be at least 50 characters">
              <Textarea placeholder="Describe your tool..." rows={3} />
            </FormField>
          </div>
        </div>
      </SubSection>

      <SubSection title="help text placement">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DoDontCard type="do" title="Help text below the input">
            <FormField
              label="api key"
              helperText="You can find this in your dashboard settings"
            >
              <Input placeholder="sk-xxxx..." />
            </FormField>
          </DoDontCard>
          <DoDontCard type="dont" title="Don't put help text above">
            <div>
              <Label>api key</Label>
              <p className="text-xs text-foreground-secondary mb-2">
                You can find this in your dashboard settings
              </p>
              <Input placeholder="sk-xxxx..." />
            </div>
          </DoDontCard>
        </div>
      </SubSection>

      <SubSection title="required vs optional">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="bg-surface p-6 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">when most fields are required</p>
            <div className="space-y-4">
              <FormField label="name" required>
                <Input placeholder="Tool name" />
              </FormField>
              <FormField label="version" required>
                <Input placeholder="1.0.0" />
              </FormField>
              <FormField label="description" helperText="(optional)">
                <Textarea placeholder="Describe your tool..." rows={2} />
              </FormField>
            </div>
          </div>
          <div className="bg-surface p-6 border border-dashed border-border">
            <p className="font-mono text-xs text-foreground-tertiary mb-4">when most fields are optional</p>
            <div className="space-y-4">
              <FormField label="website">
                <Input placeholder="https://example.com" />
              </FormField>
              <FormField label="twitter handle">
                <Input placeholder="@username" />
              </FormField>
              <FormField label="bio" helperText="required">
                <Textarea placeholder="Tell us about yourself..." rows={2} />
              </FormField>
            </div>
          </div>
        </div>
        <div className="bg-surface p-4 border border-dashed border-border">
          <p className="font-sans text-sm text-foreground-secondary">
            <strong>Rule:</strong> Mark the minority. If most fields are required, mark optional fields.
            If most are optional, mark required fields.
          </p>
        </div>
      </SubSection>

      <SubSection title="field grouping">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Group related fields with visual hierarchy.
        </p>
        <div className="bg-surface border border-dashed border-border p-6">
          <div className="space-y-8">
            {/* Group 1 */}
            <div>
              <h4 className="font-mono text-sm font-medium mb-4 pb-2 border-b border-dashed border-border">
                package details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="package name" required>
                  <Input placeholder="@scope/package" />
                </FormField>
                <FormField label="version" required>
                  <Input placeholder="1.0.0" />
                </FormField>
              </div>
            </div>

            {/* Group 2 */}
            <div>
              <h4 className="font-mono text-sm font-medium mb-4 pb-2 border-b border-dashed border-border">
                author information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="author name" required>
                  <Input placeholder="Your name" />
                </FormField>
                <FormField label="email" required>
                  <Input placeholder="author@example.com" />
                </FormField>
              </div>
            </div>

            {/* Group 3 */}
            <div>
              <h4 className="font-mono text-sm font-medium mb-4 pb-2 border-b border-dashed border-border">
                repository
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="repository type">
                  <Select
                    placeholder="Select type..."
                    options={[
                      { value: 'git', label: 'Git' },
                      { value: 'svn', label: 'SVN' },
                    ]}
                  />
                </FormField>
                <FormField label="repository url">
                  <Input placeholder="https://github.com/..." />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="danger zone">
        <p className="font-sans text-sm text-foreground-secondary mb-4">
          Destructive actions require explicit confirmation.
        </p>
        <div className="bg-surface border border-error border-dashed p-6">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="alertTriangle" size="sm" className="text-error" />
            <h4 className="font-mono text-sm font-medium text-error">danger zone</h4>
          </div>
          <div className="flex items-center justify-between py-4 border-t border-dashed border-error">
            <div>
              <p className="font-mono text-sm font-medium">delete this tool</p>
              <p className="font-sans text-xs text-foreground-secondary">
                Once deleted, this tool cannot be recovered.
              </p>
            </div>
            <Button variant="destructive" size="sm">delete tool</Button>
          </div>
          <div className="flex items-center justify-between py-4 border-t border-dashed border-error">
            <div>
              <p className="font-mono text-sm font-medium">transfer ownership</p>
              <p className="font-sans text-xs text-foreground-secondary">
                Transfer this tool to another user or organization.
              </p>
            </div>
            <Button variant="outline" size="sm">transfer</Button>
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}
