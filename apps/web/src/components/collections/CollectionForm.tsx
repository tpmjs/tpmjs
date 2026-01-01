'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Input } from '@tpmjs/ui/Input/Input';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { useState } from 'react';

interface CollectionFormProps {
  initialData?: {
    name: string;
    description: string | null;
    isPublic: boolean;
  };
  onSubmit: (data: { name: string; description?: string; isPublic: boolean }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export function CollectionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create Collection',
}: CollectionFormProps): React.ReactElement {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      newErrors.name = 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Name"
        htmlFor="collection-name"
        required
        error={errors.name}
        state={errors.name ? 'error' : 'default'}
      >
        <Input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Collection"
          state={errors.name ? 'error' : 'default'}
          disabled={isSubmitting}
          maxLength={100}
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="collection-description"
        error={errors.description}
        state={errors.description ? 'error' : 'default'}
        helperText="Optional. Describe what this collection is for."
      >
        <Textarea
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A collection of tools for..."
          state={errors.description ? 'error' : 'default'}
          disabled={isSubmitting}
          rows={3}
          maxLength={500}
          showCount
        />
      </FormField>

      <div className="pt-2">
        <Checkbox
          id="collection-public"
          label="Make this collection public"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-foreground-tertiary mt-1 ml-7">
          Public collections can be viewed by anyone with the link
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
