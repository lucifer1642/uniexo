'use client';

import { useState } from 'react';
import { useAdminTransactions } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { Transaction, User } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  credit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  debit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  commission: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  refund: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  withdrawal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useAdminTransactions(page, limit);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
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

  const transactions = data?.data || [];
  const pagination = data?.pagination;

  const getUserName = (user: User | string) =>
    typeof user === 'object' && user !== null ? user.name : 'N/A';

  const typeIcon = (type: string) => {
    if (type === 'credit' || type === 'refund') {
      return <ArrowDownLeft className="w-3.5 h-3.5" />;
    }
    return <ArrowUpRight className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="w-7 h-7" />
          Transactions
        </h1>
        <p className="text-sm text-muted-foreground">
          {pagination?.total || 0} total transaction(s)
        </p>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No transactions found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Service</th>
                  <th className="px-4 py-3 text-left font-medium">Balance After</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((txn: Transaction) => (
                  <tr key={txn._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{getUserName(txn.userId)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_COLORS[txn.type] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {typeIcon(txn.type)}
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          txn.type === 'credit' || txn.type === 'refund'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {txn.type === 'credit' || txn.type === 'refund' ? '+' : '-'}₹
                        {txn.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-50 truncate">
                      {txn.description}
                    </td>
                    <td className="px-4 py-3">
                      {txn.serviceType ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {txn.serviceType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">₹{txn.balanceAfter.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(txn.createdAt).toLocaleDateString()}{' '}
                      {new Date(txn.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
