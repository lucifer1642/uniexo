'use client';

import { useAdminDashboard } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { NexusDashboard } from '@/components/admin/nexus-dashboard';
import Link from 'next/link';
import type { Booking, Payment, User as UserType } from '@/types';

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Nexus Control</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse bg-white/5 border-white/10">
              <div className="h-4 bg-white/10 rounded w-24 mb-3" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getUserName = (user: UserType | string | undefined) =>
    typeof user === 'object' && user !== null ? user.name : 'N/A';

  return (
    <div className="space-y-8">
      <NexusDashboard />

      {/* Recent Bookings */}
      {data?.recentBookings && data.recentBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentBookings.map((booking: Booking) => (
                    <tr key={booking._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{getUserName(booking.userId as UserType)}</td>
                      <td className="px-4 py-3">{getUserName(booking.vendorId as UserType)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">₹{booking.totalAmount?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Payments */}
      {data?.recentPayments && data.recentPayments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Payments</h2>
            <Link href="/admin/payments" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Amount</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentPayments.map((payment: Payment) => (
                    <tr key={payment._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{getUserName(payment.userId as UserType)}</td>
                      <td className="px-4 py-3 font-medium">₹{payment.amount?.toLocaleString() || '0'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'captured' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          payment.status === 'refunded' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
