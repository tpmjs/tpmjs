'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Header } from '@tpmjs/ui/Header/Header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Minimal header for auth pages (sign-in, sign-up, verify-email)
 * Shows logo on left, contextual auth link on right
 */
export function AuthHeader(): React.ReactElement {
  const pathname = usePathname();
  const isSignIn = pathname === '/sign-in';
  const isSignUp = pathname === '/sign-up';

  return (
    <Header
      title={
        <Link
          href="/"
          className="text-foreground hover:text-foreground text-xl md:text-2xl font-bold uppercase tracking-tight"
        >
          TPMJS
        </Link>
      }
      size="md"
      sticky={true}
      actions={
        <div className="flex items-center gap-2">
          {isSignIn && (
            <>
              <span className="text-foreground-secondary text-sm hidden sm:inline">
                Don&apos;t have an account?
              </span>
              <Link href="/sign-up">
                <Button variant="outline" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          {isSignUp && (
            <>
              <span className="text-foreground-secondary text-sm hidden sm:inline">
                Already have an account?
              </span>
              <Link href="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </>
          )}
          {!isSignIn && !isSignUp && (
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      }
    />
  );
}
