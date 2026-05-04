'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShieldCheck, User, ArrowLeft, Zap, Home, Car, Bell, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationCenter } from './notification-center';

const BOTTOM_NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/vehicles', icon: Car, label: 'Services' },
  { href: '#notifications', icon: Bell, label: 'Alerts' },
  { href: '#profile', icon: User, label: 'Profile' },
];

export function Navbar() {
  const { openProfileSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const isHiddenRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/admin');

  if (isHiddenRoute) return null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      toast.success('Successfully logged out', { icon: '👋' });
      window.location.href = '/';
    }
  };

  const getActiveTab = () => {
    if (pathname === '/') return '/';
    if (['/vehicles', '/houses', '/marketplace', '/laundry'].some(p => pathname.startsWith(p))) return '/vehicles';
    return pathname;
  };

  const handleBottomNavTap = (href: string) => {
    if (href === '#profile') {
      openProfileSidebar();
    } else if (href === '#notifications') {
      // Notifications handled by the bell icon in top nav
      // On mobile, we'll open the notification center
      openProfileSidebar();
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 md:h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 tap-feedback">
              <span className="text-xl md:text-2xl font-black tracking-tighter text-primary">
                UNIEXO
              </span>
            </Link>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && pathname !== '/' && (
                <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary font-bold">
                  <Link href={user?.role === 'vendor' ? '/dashboard' : '/'}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl border-primary/20 hover:bg-primary/5">
                  <Link href="/admin">
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                </Button>
              )}

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <NotificationCenter />
                  <Button 
                    onClick={openProfileSidebar}
                    variant="outline" 
                    className="relative h-11 px-4 rounded-2xl gap-3 border-primary/10 hover:border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-end relative z-10">
                       <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 group-hover:text-primary transition-colors">Command Center</span>
                       <span className="text-xs font-black text-primary leading-none flex items-center gap-1">
                         ACCESS NEXUS <Zap className="w-2.5 h-2.5" />
                       </span>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-background group-hover:scale-110 transition-transform relative z-10 shadow-xl">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-white font-black text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild className="font-bold hover:text-primary">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="font-black rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile: Show avatar + notification only */}
            <div className="flex md:hidden items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <NotificationCenter />
                  <Button 
                    onClick={openProfileSidebar}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                  >
                    <Avatar className="h-8 w-8 border-2 border-background shadow-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-white font-black text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" asChild className="font-bold text-xs hover:text-primary h-9 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="font-black rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20 h-9 px-3 text-xs">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation Bar ───────────────────────── */}
      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe">
            <div className="flex items-center justify-around h-16">
              {BOTTOM_NAV_ITEMS.map((item) => {
                const isActive = item.href === getActiveTab();
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.href}
                    onClick={() => handleBottomNavTap(item.href)}
                    whileTap={{ scale: 0.85 }}
                    className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors ${
                      isActive ? 'text-lime-400' : 'text-zinc-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-lime-400 rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
