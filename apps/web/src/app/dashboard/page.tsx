import { SignOutButton } from '@/components/auth/SignOutButton';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <SignOutButton />
        </div>

        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <span className="block text-sm text-foreground-secondary">Name</span>
              <p className="text-foreground font-medium">{session.user.name}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email</span>
              <p className="text-foreground font-medium">{session.user.email}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email Verified</span>
              <p className="text-foreground font-medium">
                {session.user.emailVerified ? (
                  <span className="text-green-600">Verified</span>
                ) : (
                  <span className="text-amber-600">Not verified</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
