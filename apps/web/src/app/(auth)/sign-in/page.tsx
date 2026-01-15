'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import Link from 'next/link';
import { useState } from 'react';
import { signIn } from '~/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            // Redirect on successful sign-in
            window.location.href = '/dashboard';
          },
          onError: (ctx) => {
            console.error('Sign in error:', ctx.error);
            setError(ctx.error.message || 'Failed to sign in');
            setLoading(false);
          },
        }
      );

      // Handle case where no callback was triggered
      if (result.error) {
        console.error('Sign in error:', result.error);
        setError(result.error.message || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // If we have data but onSuccess didn't fire, redirect manually
      if (result.data) {
        window.location.href = '/dashboard';
      } else {
        // Neither data nor error - something unexpected happened
        console.error('Sign in returned no data or error:', result);
        setError('Sign in failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
        <p className="text-foreground-secondary mt-2">Welcome back to TPMJS</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
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
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-foreground-secondary hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon icon={showPassword ? 'eyeOff' : 'eye'} size="sm" />
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="text-foreground hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
