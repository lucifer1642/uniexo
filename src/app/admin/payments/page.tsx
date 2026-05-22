'use client';

import { useState } from 'react';
import { useAdminPayments } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Payment, User } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  authorized: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  captured: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useAdminPayments(page, limit);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
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

  const payments = data?.data || [];
  const pagination = data?.pagination;

  const getUserName = (user: User | string) =>
    typeof user === 'object' && user !== null ? user.name : 'N/A';
  const getUserEmail = (user: User | string) =>
    typeof user === 'object' && user !== null ? user.email : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="w-7 h-7" />
          Payments
        </h1>
        <p className="text-sm text-muted-foreground">
          {pagination?.total || 0} total payment(s)
        </p>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No payments found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Razorpay Order</th>
                  <th className="px-4 py-3 text-left font-medium">Payment ID</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Currency</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Method</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment: Payment) => (
                  <tr key={payment._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{getUserName(payment.userId)}</p>
                        <p className="text-xs text-muted-foreground">{getUserEmail(payment.userId)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{payment.razorpayOrderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {payment.razorpayPaymentId || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground uppercase text-xs">
                      {payment.currency || 'INR'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[payment.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                      {payment.method || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(payment.createdAt).toLocaleDateString()}{' '}
                      {new Date(payment.createdAt).toLocaleTimeString([], {
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
