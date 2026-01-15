'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { suggestUsername } from '@tpmjs/types/user';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { signUp } from '~/lib/auth-client';

interface UsernameCheckResult {
  available: boolean;
  reason?: string;
}

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Username availability state
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameEdited, setUsernameEdited] = useState(false);

  // Auto-generate username from name (only if user hasn't manually edited it)
  useEffect(() => {
    if (!usernameEdited && name.length >= 2) {
      const suggested = suggestUsername(name);
      if (suggested.length >= 3) {
        setUsername(suggested);
      }
    }
  }, [name, usernameEdited]);

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameCheck({ available: false, reason: 'Username must be at least 3 characters' });
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
  }, []);

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
    setUsernameEdited(true);
    // Force lowercase and remove invalid characters
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate username
    if (!username || username.length < 3) {
      setError('Please choose a valid username (at least 3 characters)');
      return;
    }

    if (usernameCheck && !usernameCheck.available) {
      setError(usernameCheck.reason || 'Please choose a different username');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError(signUpError.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      if (data) {
        // Account created - now set the username (REQUIRED)
        let usernameSet = false;
        let retries = 3;

        while (!usernameSet && retries > 0) {
          try {
            const profileResponse = await fetch('/api/user/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username }),
            });

            if (profileResponse.ok) {
              usernameSet = true;
            } else {
              const errorData = await profileResponse.json();
              if (errorData.error === 'This username is already taken') {
                // Username was taken between check and signup
                setError('Username was taken. Please choose a different one and try signing in.');
                setLoading(false);
                return;
              }
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
          } catch {
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        if (!usernameSet) {
          // Critical: Username couldn't be set, but account exists
          // Redirect to profile page to set it manually
          console.error('Failed to set username after retries');
          window.location.href = '/dashboard/settings/profile?setup=1';
          return;
        }

        // Redirect to verify email page
        window.location.href = '/verify-email';
      }
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        <p className="text-foreground-secondary mt-2">Join TPMJS to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-secondary">
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
                <Icon icon="loader" size="sm" className="animate-spin text-foreground-secondary" />
              )}
              {!checkingUsername && usernameCheck?.available && (
                <Icon icon="check" size="sm" className="text-success" />
              )}
              {!checkingUsername &&
                usernameCheck &&
                !usernameCheck.available &&
                username.length >= 3 && (
                  <Icon icon="x" size="sm" className="text-error" />
                )}
            </div>
          </div>
          {/* Username availability message */}
          {username.length >= 3 && usernameCheck && !usernameCheck.available && (
            <p className="mt-1 text-xs text-error">{usernameCheck.reason}</p>
          )}
          {username.length >= 3 && usernameCheck?.available && (
            <p className="mt-1 text-xs text-success">Username available</p>
          )}
          {username && (
            <p className="mt-1 text-xs text-foreground-tertiary">
              Your profile: tpmjs.com/@{username}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || (usernameCheck !== null && !usernameCheck.available)}
          loading={loading}
          className="w-full"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-secondary">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
