'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  tier: string;
  role: string;
  signupSource: string | null;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    collections: number;
    agents: number;
    activities: number;
    toolLikes: number;
    apiKeys: number;
    tpmjsApiKeys: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403) throw new Error('Access denied. Admin role required.');
      if (!res.ok) throw new Error('Failed to load users');

      const json = await res.json();
      setUsers(json.data.users);
      setHasMore(json.data.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  if (error) {
    return (
      <DashboardLayout
        title="Users"
        subtitle="Admin user management"
        showBackButton
        backUrl="/dashboard/admin"
      >
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Icon icon="alertCircle" size="lg" className="text-danger" />
          <p className="text-foreground-secondary">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Users"
      subtitle="Admin user management"
      showBackButton
      backUrl="/dashboard/admin"
    >
      <div className="space-y-6">
        {/* Search bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, email, or username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Icon icon="search" size="sm" />
          </Button>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                    Tier
                  </th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                    Source
                  </th>
                  <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                    Collections
                  </th>
                  <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                    Agents
                  </th>
                  <th className="text-right px-4 py-3 text-foreground-secondary font-medium">
                    Activities
                  </th>
                  <th className="text-left px-4 py-3 text-foreground-secondary font-medium">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0 hover:bg-surface-secondary/50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-foreground-tertiary">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-foreground-tertiary">@{user.username}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{user.tier}</Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary text-xs">
                      {user.signupSource || '-'}
                    </td>
                    <td className="text-right px-4 py-3 text-foreground-secondary">
                      {user._count.collections}
                    </td>
                    <td className="text-right px-4 py-3 text-foreground-secondary">
                      {user._count.agents}
                    </td>
                    <td className="text-right px-4 py-3 text-foreground-secondary">
                      {user._count.activities}
                    </td>
                    <td className="px-4 py-3 text-foreground-secondary text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-foreground-secondary">Page {page}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
