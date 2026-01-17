'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { useSession } from '~/lib/auth-client';

function CliAuthContent(): React.ReactElement {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = searchParams.get('state');
  const callback = searchParams.get('callback');

  const handleAuthorize = useCallback(async () => {
    if (!state || !callback) {
      setError('Missing state or callback parameter');
      return;
    }

    setIsAuthorizing(true);
    setError(null);

    try {
      // Create an API key for CLI access
      const response = await fetch('/api/user/tpmjs-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `CLI (${new Date().toLocaleDateString()})` }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to create API key');
        setIsAuthorizing(false);
        return;
      }

      // Redirect back to CLI with the API key
      const callbackUrl = new URL(callback);
      callbackUrl.searchParams.set('state', state);
      callbackUrl.searchParams.set('key', result.apiKey.key);

      window.location.href = callbackUrl.toString();
    } catch (err) {
      console.error('Authorization failed:', err);
      setError('Failed to authorize. Please try again.');
      setIsAuthorizing(false);
    }
  }, [state, callback]);

  const handleDeny = useCallback(() => {
    if (!callback || !state) return;

    const callbackUrl = new URL(callback);
    callbackUrl.searchParams.set('state', state);
    callbackUrl.searchParams.set('error', 'access_denied');

    window.location.href = callbackUrl.toString();
  }, [state, callback]);

  // Validate parameters
  if (!state || !callback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <Icon icon="alertCircle" size="lg" className="text-error" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Invalid Request</h1>
          <p className="text-foreground-secondary mb-6">
            Missing required parameters. Please try authenticating again from the CLI.
          </p>
          <Button variant="outline" onClick={() => window.close()}>
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Icon icon="loader" size="lg" className="text-primary animate-spin" />
          <p className="text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!session?.user) {
    const returnUrl = `/cli/auth?state=${encodeURIComponent(state)}&callback=${encodeURIComponent(callback)}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon icon="terminal" size="lg" className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">CLI Authentication</h1>
          <p className="text-foreground-secondary mb-6">
            Sign in to authorize the TPMJS CLI to access your account.
          </p>
          <Link href={`/sign-in?redirect=${encodeURIComponent(returnUrl)}`}>
            <Button className="w-full">
              <Icon icon="user" size="sm" className="mr-2" />
              Sign In to Continue
            </Button>
          </Link>
          <p className="text-sm text-foreground-tertiary mt-4">
            Don&apos;t have an account?{' '}
            <Link href={`/sign-up?redirect=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const user = session.user;

  // Signed in - show authorization prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon icon="terminal" size="lg" className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Authorize CLI Access</h1>
          <p className="text-foreground-secondary">
            The TPMJS CLI is requesting access to your account.
          </p>
        </div>

        {/* User info */}
        <div className="bg-surface-secondary border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="user" size="sm" className="text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">
                {user.name || 'User'}
              </p>
              <p className="text-sm text-foreground-secondary">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">This will allow the CLI to:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Icon icon="check" size="xs" className="text-success" />
              Access your collections and agents
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Icon icon="check" size="xs" className="text-success" />
              Execute tools on your behalf
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Icon icon="check" size="xs" className="text-success" />
              Manage your TPMJS resources
            </li>
          </ul>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="w-full"
          >
            {isAuthorizing ? (
              <>
                <Icon icon="loader" size="sm" className="mr-2 animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                <Icon icon="check" size="sm" className="mr-2" />
                Authorize CLI
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isAuthorizing}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-foreground-tertiary text-center mt-6">
          An API key will be created and sent to the CLI.
          You can revoke it anytime from your dashboard.
        </p>
      </div>
    </div>
  );
}

export default function CliAuthPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Icon icon="loader" size="lg" className="text-primary animate-spin" />
        </div>
      }
    >
      <CliAuthContent />
    </Suspense>
  );
}
