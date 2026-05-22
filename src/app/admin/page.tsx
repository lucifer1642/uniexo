'use client';

import { useAdminDashboard } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { UniExoDashboard } from '@/components/admin/uniexo-dashboard';
import Link from 'next/link';
import type { Booking, Payment, User as UserType } from '@/types';

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 theme-landing">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">UniExo <span className="text-primary italic">Control</span></h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse bg-surface border-border">
              <div className="h-4 bg-muted/20 rounded w-24 mb-3" />
              <div className="h-8 bg-muted/20 rounded w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getUserName = (user: UserType | string | undefined) =>
    typeof user === 'object' && user !== null ? user.name : 'N/A';

  return (
    <div className="space-y-8 theme-landing">
      <UniExoDashboard />

      {/* Recent Bookings */}
      {data?.recentBookings && data.recentBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-xs font-black tracking-widest text-primary hover:opacity-80 uppercase bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 transition-all">
              VIEW ALL ASSETS
            </Link>
          </div>
          <Card className="overflow-hidden bg-surface border-border shadow-2xl rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/5 border-b border-border">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentBookings.map((booking: Booking) => (
                    <tr key={booking._id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 font-bold text-foreground">{getUserName(booking.userId as UserType)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{getUserName(booking.vendorId as UserType)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-foreground">₹{booking.totalAmount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">{new Date(booking.createdAt).toLocaleDateString()}</td>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Revenue Stream</h2>
            <Link href="/admin/payments" className="text-xs font-black tracking-widest text-primary hover:opacity-80 uppercase bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 transition-all">
              AUDIT LOGS
            </Link>
          </div>
          <Card className="overflow-hidden bg-surface border-border shadow-2xl rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/5 border-b border-border">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">User</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentPayments.map((payment: Payment) => (
                    <tr key={payment._id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{getUserName(payment.userId as UserType)}</td>
                      <td className="px-6 py-4 font-black text-foreground text-lg">₹{payment.amount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          payment.status === 'captured' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          payment.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          payment.status === 'refunded' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-muted/10 text-muted-foreground border border-border'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">{new Date(payment.createdAt).toLocaleDateString()}</td>
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
