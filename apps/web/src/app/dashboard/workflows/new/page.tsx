'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { Select } from '@tpmjs/ui/Select/Select';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface FormData {
  name: string;
  uid: string;
  description: string;
  triggerType: 'MANUAL' | 'WEBHOOK' | 'SCHEDULE';
}

const generateUid = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
};

export default function NewWorkflowPage(): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    uid: '',
    description: '',
    triggerType: 'MANUAL',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-generate uid from name if uid is empty or was auto-generated
      if (name === 'name' && (!prev.uid || prev.uid === generateUid(prev.name))) {
        newData.uid = generateUid(value);
      }

      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dashboard/workflows/${result.data.id}`);
      } else {
        throw new Error(result.error || 'Failed to create workflow');
      }
    } catch (err) {
      console.error('Failed to create workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-3xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/workflows"
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            <Icon icon="arrowLeft" size="sm" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create New Workflow</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" required className="mb-1">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="My Workflow"
                />
              </div>

              <div>
                <Label htmlFor="uid" className="mb-1">
                  UID (URL-friendly identifier)
                </Label>
                <Input
                  id="uid"
                  name="uid"
                  value={formData.uid}
                  onChange={handleChange}
                  maxLength={50}
                  pattern="[a-z0-9-]+"
                  placeholder="my-workflow"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  Used in API URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="mb-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={2000}
                  rows={3}
                  resize="none"
                  placeholder="What does this workflow do?"
                />
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Trigger</h2>

            <div>
              <Label htmlFor="triggerType" required className="mb-1">
                Trigger Type
              </Label>
              <Select
                id="triggerType"
                name="triggerType"
                value={formData.triggerType}
                onChange={handleChange}
                required
                options={[
                  { value: 'MANUAL', label: 'Manual - Run on demand' },
                  { value: 'WEBHOOK', label: 'Webhook - Triggered by HTTP request' },
                  { value: 'SCHEDULE', label: 'Schedule - Run on a cron schedule' },
                ]}
              />
            </div>
          </div>

          {/* Info banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon icon="info" size="sm" className="text-primary mt-0.5" />
              <div className="text-sm">
                <p className="text-foreground">
                  After creating the workflow, you&apos;ll be taken to the visual canvas where you
                  can drag and drop tools, agents, and logic nodes to build your pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon icon="alertCircle" size="sm" className="text-error mt-0.5" />
                <p className="text-sm text-error">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/workflows">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
