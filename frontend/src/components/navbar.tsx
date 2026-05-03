'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ShieldCheck, User, ArrowLeft, Zap } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationCenter } from './notification-center';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openProfileSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter text-primary">
                UNIEXO
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Back to Dashboard Button */}
            {isAuthenticated && pathname !== '/' && (
              <Button variant="ghost" asChild className="hidden md:flex gap-2 text-muted-foreground hover:text-primary font-bold">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </Button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Button variant="outline" size="sm" asChild className="hidden md:flex gap-1.5 rounded-xl border-primary/20 hover:bg-primary/5">
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
                  <div className="flex flex-col items-end hidden sm:flex relative z-10">
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

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="ml-2 rounded-xl"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          {isAuthenticated && pathname !== '/' && (
            <Button variant="outline" className="w-full h-12 rounded-xl gap-2 justify-start px-4" asChild onClick={() => setIsMobileMenuOpen(false)}>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
          )}

          {isAuthenticated && user ? (
            <Button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                openProfileSidebar();
              }}
              className="w-full h-16 rounded-2xl gap-3 justify-start px-4 bg-primary/5 hover:bg-primary/10 border-primary/10 transition-all"
              variant="outline"
            >
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary text-white">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-black leading-none text-primary">{user.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-black">Open Command Center</div>
              </div>
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12 rounded-xl font-bold" asChild>
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
              </Button>
              <Button className="h-12 rounded-xl font-black" asChild>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
