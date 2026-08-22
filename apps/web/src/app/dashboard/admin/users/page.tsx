'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Select } from '@tpmjs/ui/Select/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { PageState, StatusBadge, TimeAgo } from '~/components/admin/AdminUi';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import type { AdminUserRow } from '~/lib/admin/types';

const ROLE_OPTIONS = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];
const TIER_OPTIONS = [
  { value: 'FREE', label: 'FREE' },
  { value: 'PRO', label: 'PRO' },
  { value: 'ENTERPRISE', label: 'ENTERPRISE' },
];

interface UsersPayload {
  users: AdminUserRow[];
  pagination: { hasMore: boolean };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403 || res.status === 401)
        throw new Error('Access denied. Admin role required.');
      if (!res.ok) throw new Error('Failed to load users');
      const json = (await res.json()) as { data: UsersPayload };
      setUsers(json.data.users);
      setHasMore(json.data.pagination.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const updateUser = async (user: AdminUserRow, patch: { role?: string; tier?: string }) => {
    const what = patch.role ? `role → ${patch.role}` : `tier → ${patch.tier}`;
    if (patch.role && !window.confirm(`Set ${user.email} ${what}?`)) return;
    setBusyId(user.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error ?? `HTTP ${res.status}`);
      setNotice(`${user.email}: ${what}`);
      await fetchUsers();
    } catch (err) {
      setNotice(`Failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusyId(null);
    }
  };

  const admins = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <DashboardLayout
      title="Users"
      subtitle="Accounts, roles and tiers — promote or demote admins here"
      showBackButton
      backUrl="/dashboard/admin"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Search users"
            placeholder="Search by name, email, or username…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearch(searchInput);
              }
            }}
            className="w-80"
          />
          <Button
            variant="secondary"
            onClick={() => {
              setPage(1);
              setSearch(searchInput);
            }}
          >
            <Icon icon="search" size="sm" />
          </Button>
          <span className="ml-auto text-xs text-foreground-tertiary">
            {admins} admin{admins === 1 ? '' : 's'} on this page · you are{' '}
            {session?.user?.email ?? '…'}
          </span>
        </div>

        {notice && (
          <div
            className={`text-sm px-4 py-2 rounded-lg border ${notice.startsWith('Failed') ? 'border-error text-error bg-error/10' : 'border-success text-success bg-success/10'}`}
          >
            {notice}
          </div>
        )}

        <PageState
          loading={loading && users.length === 0}
          error={error}
          onRetry={() => void fetchUsers()}
        >
          <div className="bg-surface border border-border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Collections</TableHead>
                  <TableHead className="text-right">Agents</TableHead>
                  <TableHead className="text-right">API keys</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.id === session?.user?.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {user.name}
                          {user.role === 'ADMIN' && <StatusBadge status="admin" />}
                          {isSelf && (
                            <span className="text-xs text-foreground-tertiary">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-foreground-tertiary">
                          {user.email}
                          {user.username && ` · @${user.username}`}
                          {!user.emailVerified && ' · unverified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          size="sm"
                          aria-label={`Role for ${user.email}`}
                          value={user.role}
                          options={ROLE_OPTIONS}
                          disabled={busyId === user.id || isSelf}
                          onChange={(e) => void updateUser(user, { role: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="sm"
                          aria-label={`Tier for ${user.email}`}
                          value={user.tier}
                          options={TIER_OPTIONS}
                          disabled={busyId === user.id}
                          onChange={(e) => void updateUser(user, { tier: e.target.value })}
                        />
                      </TableCell>
                      <TableCell className="text-foreground-secondary text-xs">
                        {user.signupSource || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user._count.collections}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user._count.agents}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user._count.tpmjsApiKeys}
                      </TableCell>
                      <TableCell className="text-right text-foreground-tertiary">
                        <TimeAgo iso={user.createdAt} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </PageState>

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
