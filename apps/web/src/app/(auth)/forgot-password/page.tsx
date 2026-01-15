'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the password reset API endpoint
      const response = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Forgot password exception:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
          <p className="text-foreground-secondary mt-2">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset
            link.
          </p>
        </div>

        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-md text-sm">
          Check your inbox and click the link to reset your password. The link will expire in 1
          hour.
        </div>

        <p className="text-center text-sm text-foreground-secondary">
          Didn&apos;t receive the email?{' '}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            className="p-0 h-auto text-foreground hover:underline font-medium"
          >
            Try again
          </Button>
        </p>

        <p className="text-center text-sm text-foreground-secondary">
          <Link href="/sign-in" className="text-foreground hover:underline font-medium">
            Back to Sign In
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        <p className="text-foreground-secondary mt-2">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

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

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          className="w-full"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-secondary">
        Remember your password?{' '}
        <Link href="/sign-in" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
