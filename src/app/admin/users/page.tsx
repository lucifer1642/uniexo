'use client';

import { useState } from 'react';
import { useAdminUsers, useSuspendUser } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Ban, CheckCircle, ChevronLeft, ChevronRight, Shield, User as UserIcon, ShieldCheck } from 'lucide-react';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const roleFilter = 'user'; // Only show regular users here; vendors are managed in Vendors tab
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useAdminUsers(page, limit, roleFilter, debouncedSearch);
  const suspendUser = useSuspendUser();

  const handleSearchSubmit = () => {
    setDebouncedSearch(search);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleSuspend = (userId: string, currentState: boolean) => {
    if (!confirm(`Are you sure you want to ${currentState ? 'unsuspend' : 'suspend'} this user?`)) return;
    suspendUser.mutate({ userId, suspended: !currentState });
  };

  const roleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="w-3.5 h-3.5" />;
    if (role === 'vendor') return <ShieldCheck className="w-3.5 h-3.5" />;
    return <UserIcon className="w-3.5 h-3.5" />;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      vendor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.user}`}>
        {roleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-48 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const users = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          {pagination?.total || 0} total user(s)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearchSubmit}>
          Search
        </Button>
      </div>

      {/* User Table */}
      {users.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No users found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user: User) => (
                  <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {user.isSuspended ? (
                          <Badge variant="destructive" className="text-xs w-fit">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs w-fit text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">Active</Badge>
                        )}
                        {!user.isEmailVerified && (
                          <Badge variant="outline" className="text-xs w-fit text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">Unverified</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant={user.isSuspended ? 'outline' : 'destructive'}
                          onClick={() => handleSuspend(user._id, user.isSuspended)}
                          disabled={suspendUser.isPending}
                          className="text-xs"
                        >
                          {user.isSuspended ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Unsuspend
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Suspend
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
