'use client';

import { signUp } from '@/lib/auth-client';
import { suggestUsername } from '@tpmjs/types/user';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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
        // Account created - now set the username
        try {
          const profileResponse = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });

          if (!profileResponse.ok) {
            console.warn('Failed to set username, user can set it later');
          }
        } catch {
          console.warn('Failed to set username, user can set it later');
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-secondary">
              @
            </div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              required
              minLength={3}
              maxLength={30}
              className="w-full pl-7 pr-10 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
              placeholder="username"
            />
            {/* Status indicator */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {checkingUsername && (
                <svg
                  className="animate-spin h-4 w-4 text-foreground-secondary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {!checkingUsername && usernameCheck?.available && (
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {!checkingUsername &&
                usernameCheck &&
                !usernameCheck.available &&
                username.length >= 3 && (
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
            </div>
          </div>
          {/* Username availability message */}
          {username.length >= 3 && usernameCheck && !usernameCheck.available && (
            <p className="mt-1 text-xs text-red-500">{usernameCheck.reason}</p>
          )}
          {username.length >= 3 && usernameCheck?.available && (
            <p className="mt-1 text-xs text-green-600">Username available</p>
          )}
          {username && (
            <p className="mt-1 text-xs text-foreground-tertiary">
              Your profile: tpmjs.com/@{username}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading || (usernameCheck !== null && !usernameCheck.available)}
          className="w-full py-2 px-4 bg-foreground text-background font-medium rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
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
