import { AuthHeader } from '@/components/AuthHeader';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8">{children}</div>
      </div>
    </div>
  );
}
