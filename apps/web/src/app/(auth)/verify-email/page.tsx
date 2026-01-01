import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-foreground/10 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
        <p className="text-foreground-secondary mt-2">
          We&apos;ve sent you a verification link. Please check your email to verify your account.
        </p>
      </div>

      <div className="text-sm text-foreground-secondary">
        <p>Didn&apos;t receive the email?</p>
        <p className="mt-1">Check your spam folder or try signing up again.</p>
      </div>

      <Link href="/sign-in" className="inline-block text-foreground hover:underline font-medium">
        Back to sign in
      </Link>
    </div>
  );
}
