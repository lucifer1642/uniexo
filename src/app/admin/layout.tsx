'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { LayoutDashboard, Users, ShieldCheck, Settings, CalendarCheck, CreditCard, ArrowLeftRight, Flag, Trophy, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';

import { NotificationCenter } from '@/components/notification-center';
import { Zap } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/intelligence', label: 'Intelligence', icon: Zap },
  { href: '/admin/vendors', label: 'Vendors', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/rank-optimization', label: 'Rank Optimization', icon: Trophy },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/kyc', label: 'KYC & Verification', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950/50 flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 shrink-0 bg-card border-r fixed h-screen overflow-y-auto z-40 hidden lg:block">
          <div className="p-4 flex flex-col h-full">
            <div className="space-y-1 flex-1">
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
            </div>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 rotate-90" />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
              />
              {/* Slide-in Panel */}
              <motion.aside
                className="fixed top-0 left-0 h-screen w-72 bg-card/95 backdrop-blur-xl border-r z-50 overflow-y-auto lg:hidden"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="p-4 flex flex-col h-full">
                  {/* Close button & title */}
                  <div className="flex items-center justify-between mb-4 px-3">
                    <h2 className="text-lg font-bold">Admin Panel</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-1 flex-1">
                    {ADMIN_NAV.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
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
                  </div>
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <ArrowLeftRight className="w-4 h-4 rotate-90" />
                    Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
          <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 shrink-0">
             <div className="flex items-center gap-3">
               <button
                 onClick={() => setSidebarOpen(true)}
                 className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
               >
                 <Menu className="w-5 h-5" />
               </button>
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 UniExo Management Console
               </div>
             </div>
             <div className="flex items-center gap-4">
                <NotificationCenter />
                <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold leading-none">System Admin</p>
                   <p className="text-[10px] text-muted-foreground">LPU Campus</p>
                </div>
             </div>
          </header>
          <main className="p-4 lg:p-8 flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
