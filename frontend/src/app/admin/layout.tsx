'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { LayoutDashboard, Users, ShieldCheck, Settings, CalendarCheck, CreditCard, ArrowLeftRight, Flag, Trophy } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/vendors', label: 'Vendors', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/rank-optimization', label: 'Rank Optimization', icon: Trophy },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950/50 flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-card border-r fixed h-screen overflow-y-auto z-40">
          <div className="p-4 space-y-1">
                <h2 className="text-lg font-bold mb-4 px-3">Admin Panel</h2>
                {ADMIN_NAV.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors mt-auto"
                >
                  <ArrowLeftRight className="w-4 h-4 rotate-90" />
                  Logout
                </button>
              </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 min-w-0">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
