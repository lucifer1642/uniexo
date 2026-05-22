'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShieldCheck, User, ArrowLeft, Zap, Home, Car, Bell, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationCenter } from './notification-center';
import { ThemeToggle } from './theme-toggle';
import { UniExoBrand } from './brand';
import { haptics } from '@/lib/haptics';

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
      // Removed supabase signout
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
    haptics.selection();
    if (href === '#profile') {
      openProfileSidebar();
    } else if (href === '#notifications') {
      openProfileSidebar();
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-primary border-b border-white/10 theme-landing">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="flex h-14 md:h-[4.5rem] items-center justify-between">
            {/* Logo & Left Content */}
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/" className="flex items-center gap-2 tap-feedback">
                <UniExoBrand />
              </Link>

              {isAuthenticated && user && (
                <div className="hidden md:block">
                  <Button
                    onClick={openProfileSidebar}
                    variant="ghost"
                    className="relative h-10 px-4 rounded-2xl gap-3 border border-white/20 hover:border-accent/50 bg-white/5 hover:bg-white/10 text-white transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-start relative z-10">
                       <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1 group-hover:text-accent transition-colors">Command Center</span>
                       <span className="text-xs font-black text-white leading-none flex items-center gap-1">
                         ACCESS UNIEXO <Zap className="w-2.5 h-2.5 text-accent" />
                       </span>
                    </div>
                  </Button>
                </div>
              )}
            </div>

            {/* Desktop Nav Items (Right) */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && pathname !== '/' && pathname !== '/dashboard' && (
                <Button variant="ghost" asChild className="gap-2 text-white/70 hover:text-white hover:bg-white/10 font-bold">
                  <Link href={user?.role === 'vendor' ? '/dashboard' : '/'}>
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl border-white/20 text-white hover:bg-white/10">
                  <Link href="/admin">
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                </Button>
              )}

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <NotificationCenter />
                  <ThemeToggle />
                  <Avatar
                    onClick={openProfileSidebar}
                    className="h-10 w-10 border-2 border-accent/50 hover:border-accent hover:scale-110 transition-all cursor-pointer shadow-xl ring-2 ring-accent/20 hover:ring-accent/40"
                  >
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-accent text-primary font-black text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Button variant="ghost" asChild className="font-bold text-white/80 hover:text-white hover:bg-white/10">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="font-black rounded-xl bg-accent text-primary hover:bg-accent/90 shadow-lg shadow-accent/30 hover:scale-105 transition-transform">
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
                  <ThemeToggle />
                  <Button
                    onClick={openProfileSidebar}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-white/10"
                  >
                    <Avatar className="h-8 w-8 border-2 border-accent/50 shadow-lg">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-accent text-primary font-black text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <ThemeToggle />
                  <Button variant="ghost" size="sm" asChild className="font-bold text-xs text-white/80 hover:text-white hover:bg-white/10 h-9 px-3">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="font-black rounded-lg bg-accent text-primary hover:bg-accent/90 shadow-lg shadow-accent/30 h-9 px-3 text-xs">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden theme-landing">
          <div className="bg-background/80 backdrop-blur-xl border-t border-border px-2 pb-safe">
            <div className="flex items-center justify-around h-[4.25rem]">
              {BOTTOM_NAV_ITEMS.map((item) => {
                const isActive = item.href === getActiveTab();
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.href}
                    onClick={() => handleBottomNavTap(item.href)}
                    whileTap={{ scale: 0.82 }}
                    className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200 ${
                      isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                    }`}
                  >
                    <motion.div
                      animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className={`w-5 h-5 mb-0.5 transition-all ${isActive ? 'drop-shadow-[0_0_6px_rgba(201,168,76,0.4)]' : ''}`} />
                    </motion.div>
                    <span className={`text-[9px] font-black uppercase tracking-wider transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
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
