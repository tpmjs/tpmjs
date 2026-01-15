'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

interface UsernameCheckResult {
  available: boolean;
  reason?: string;
}

function ProfileSettingsContent({ isSetupMode }: { isSetupMode: boolean }): React.ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Username validation
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setName(data.data.name || '');
        setUsername(data.data.username || '');
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(
    async (usernameToCheck: string) => {
      if (usernameToCheck.length < 3) {
        setUsernameCheck({ available: false, reason: 'Username must be at least 3 characters' });
        return;
      }

      // Don't check if it's the current username
      if (usernameToCheck === profile?.username) {
        setUsernameCheck({ available: true });
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(
          `/api/user/username/check?username=${encodeURIComponent(usernameToCheck)}`
        );
        const data = await response.json();

        if (data.success) {
          setUsernameCheck(data.data);
        } else {
          setUsernameCheck({ available: false, reason: 'Failed to check availability' });
        }
      } catch {
        setUsernameCheck({ available: false, reason: 'Failed to check availability' });
      } finally {
        setCheckingUsername(false);
      }
    },
    [profile?.username]
  );

  // Debounce the username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameCheck(null);
      return;
    }

    const timeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 300);

    return () => clearTimeout(timeout);
  }, [username, checkUsernameAvailability]);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Force lowercase and remove invalid characters
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(value);
    setSaveSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    // Validate username if changed
    if (username !== profile?.username) {
      if (!username || username.length < 3) {
        setSaveError('Username must be at least 3 characters');
        return;
      }

      if (usernameCheck && !usernameCheck.available) {
        setSaveError(usernameCheck.reason || 'Please choose a different username');
        return;
      }
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setSaveSuccess(true);
        // Refresh profile to get updated data
        await fetchProfile();
      } else {
        setSaveError(data.error || 'Failed to update profile');
      }
    } catch {
      setSaveError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Profile" showBackButton backUrl="/dashboard">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-secondary rounded w-48 mb-4" />
          <div className="h-32 bg-surface-secondary rounded mb-6" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout title="Profile" showBackButton backUrl="/dashboard">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error || 'Failed to load profile'}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile Settings" showBackButton backUrl="/dashboard">
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Setup mode banner */}
          {isSetupMode && !profile?.username && (
            <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <Icon icon="alertCircle" size="sm" className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Complete your account setup</p>
                <p className="text-warning/80 mt-1">
                  Please set your username to complete your account setup. This is required to use
                  MCP endpoints and public profiles.
                </p>
              </div>
            </div>
          )}

          {/* Success message */}
          {saveSuccess && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Icon icon="check" size="sm" />
              Profile updated successfully!
            </div>
          )}

          {/* Error message */}
          {saveError && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
              {saveError}
            </div>
          )}

          {/* Name field */}
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaveSuccess(false);
              }}
              required
              placeholder="Your name"
            />
          </div>

          {/* Username field */}
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-secondary z-10">
                @
              </div>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                minLength={3}
                maxLength={30}
                className="pl-7 pr-10"
                placeholder="username"
              />
              {/* Status indicator */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {checkingUsername && (
                  <Icon
                    icon="loader"
                    size="sm"
                    className="animate-spin text-foreground-secondary"
                  />
                )}
                {!checkingUsername && usernameCheck?.available && (
                  <Icon icon="check" size="sm" className="text-success" />
                )}
                {!checkingUsername &&
                  usernameCheck &&
                  !usernameCheck.available &&
                  username.length >= 3 && <Icon icon="x" size="sm" className="text-error" />}
              </div>
            </div>
            {/* Username availability message */}
            {username.length >= 3 && usernameCheck && !usernameCheck.available && (
              <p className="mt-1 text-xs text-error">{usernameCheck.reason}</p>
            )}
            {username.length >= 3 && usernameCheck?.available && (
              <p className="mt-1 text-xs text-success">
                {username === profile.username ? 'Current username' : 'Username available'}
              </p>
            )}
            <p className="mt-2 text-xs text-foreground-tertiary">
              Your public profile: tpmjs.com/@{username || 'your-username'}
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-surface-secondary text-foreground-secondary cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-foreground-tertiary">Email cannot be changed</p>
          </div>

          {/* MCP URL Preview */}
          {username && username.length >= 3 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="link" size="sm" className="text-primary" />
                <span className="text-sm font-medium text-foreground">Your MCP Server URLs</span>
              </div>
              <p className="text-xs text-foreground-secondary mb-2">
                Once you save your username, your collection MCP endpoints will be available at:
              </p>
              <code className="text-xs text-primary block">
                tpmjs.com/api/mcp/{username}/[collection-slug]/http
              </code>
            </div>
          )}

          {/* Submit button */}
          <div className="flex gap-3">
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/dashboard">
              <Button variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function ProfileSettingsWithSearchParams(): React.ReactElement {
  const searchParams = useSearchParams();
  const isSetupMode = searchParams.get('setup') === '1';
  return <ProfileSettingsContent isSetupMode={isSetupMode} />;
}

export default function ProfileSettingsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="Profile Settings" showBackButton backUrl="/dashboard">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-4" />
            <div className="h-32 bg-surface-secondary rounded mb-6" />
          </div>
        </DashboardLayout>
      }
    >
      <ProfileSettingsWithSearchParams />
    </Suspense>
  );
}
