'use client';

import { motion } from 'framer-motion';
import { 
  Car, 
  Home, 
  ShoppingBag, 
  WashingMachine, 
  ArrowRight,
  Search,
  User,
  ChevronRight,
  LayoutGrid,
  Star
} from 'lucide-react';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { haptics } from '@/lib/haptics';

import { useNotifications } from '@/hooks/use-notifications';
import { useMyBookings } from '@/hooks/use-bookings';
import { Bell, Clock, Info, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, Activity } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuthStore();
  const { openProfileSidebar, isProfileSidebarOpen } = useUIStore();
  const { notifications } = useNotifications();
  const { data: bookings } = useMyBookings();

  const quickActions = [
    { 
      label: 'Rent a Vehicle', 
      icon: Car, 
      href: '/vehicles', 
      description: 'Cars, Bikes & Scooters',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
      tag: 'FAST'
    },
    { 
      label: 'Find a Room', 
      icon: Home, 
      href: '/houses', 
      description: 'PGs, Hostels & Flats',
      gradient: 'from-lime-500/20 to-emerald-500/20',
      iconColor: 'text-lime-400',
      tag: 'SECURE'
    },
    { 
      label: 'Marketplace', 
      icon: ShoppingBag, 
      href: '/marketplace', 
      description: 'Buy & Sell Used Items',
      gradient: 'from-orange-500/20 to-yellow-500/20',
      iconColor: 'text-orange-400',
      tag: 'NEW'
    },
    { 
      label: 'Laundry Service', 
      icon: WashingMachine, 
      href: '/laundry', 
      description: 'Wash, Fold & Dry',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      tag: 'FRESH'
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground relative font-sans overflow-x-hidden has-bottom-nav md:pb-0 theme-landing">
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
            y: [0, 25, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, -50, 0],
            y: [0, -25, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-secondary/5 rounded-full blur-[80px] md:blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full">
        <main className="flex-1 transition-all duration-500 ease-in-out">
          <div className="container mx-auto px-4 py-6 md:px-8 lg:px-12 md:py-12 max-w-7xl">
            
            {/* ── Header Section ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-8 md:mb-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-1 md:mb-2">
                   <div className="h-1 w-6 md:w-8 bg-primary rounded-full" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">DASHBOARD OVERVIEW</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                  Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">{user?.name?.split(' ')[0]}</span>
                </h1>
                <p className="text-muted-foreground mt-2 md:mt-4 font-medium text-sm md:text-lg max-w-md">Access premium services and manage your campus lifestyle.</p>
              </motion.div>

              <div className="flex items-center gap-3 md:gap-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden md:flex items-center gap-3 bg-surface/40 border border-border/50 p-2 px-4 rounded-2xl backdrop-blur-3xl shadow-2xl"
                >
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-muted-foreground"
                  />
                </motion.div>
                
                <Button 
                  onClick={openProfileSidebar}
                  variant="outline"
                  className={`hidden md:flex h-14 w-14 rounded-2xl border-border bg-surface/40 backdrop-blur-xl transition-all ${isProfileSidebarOpen ? 'border-primary text-primary' : 'hover:border-primary/30'}`}
                >
                  <User className="w-6 h-6" />
                </Button>
              </div>
            </header>

            {/* ── Quick Services ──────────────────────────── */}
            <section className="mb-10 md:mb-20">
              <div className="flex items-center justify-between mb-5 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-primary/10 text-primary">
                    <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tight">Quick <span className="text-primary">Services</span></h2>
                </div>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors group text-xs md:text-sm">
                  <Link href="/vehicles">
                    <span className="hidden sm:inline">EXPLORE ALL</span>
                    <span className="sm:hidden">ALL</span>
                    <ArrowRight className="ml-1 md:ml-2 w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Mobile: Horizontal swipeable carousel */}
              <div className="flex md:hidden gap-4 overflow-x-auto snap-x-mandatory scrollbar-hide -mx-4 px-4 pb-2">
                {quickActions.map((action, idx) => (
                  <Link key={idx} href={action.href} className="group snap-center flex-shrink-0 w-[75vw]">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative overflow-hidden p-6 rounded-[2rem] bg-surface/40 border border-border/50 active:border-primary/30 transition-all duration-300 h-full flex flex-col justify-between min-h-[200px] backdrop-blur-xl"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-20`} />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-4 rounded-2xl bg-surface/60 ${action.iconColor} shadow-xl border border-white/5`}>
                            <action.icon className="w-8 h-8" />
                          </div>
                          <span className="text-[9px] font-black px-2.5 py-1 bg-surface/80 rounded-full tracking-widest text-muted-foreground border border-border">
                            {action.tag}
                          </span>
                        </div>
                        <h4 className="text-xl font-black mb-1">{action.label}</h4>
                        <p className="text-muted-foreground text-sm">{action.description}</p>
                      </div>

                      <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-bold text-primary">
                        GO TO SERVICE <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Desktop: 2-column grid */}
              <div className="hidden md:grid grid-cols-2 gap-6">
                {quickActions.map((action, idx) => (
                  <Link key={idx} href={action.href} className="group">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative overflow-hidden p-8 rounded-[2.5rem] bg-surface/40 border border-border hover:border-primary/30 transition-all duration-500 h-full flex flex-col justify-between backdrop-blur-xl group shadow-2xl"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-5 rounded-3xl bg-surface/80 ${action.iconColor} group-hover:scale-110 transition-transform duration-500 shadow-2xl border border-white/5`}>
                            <action.icon className="w-10 h-10" />
                          </div>
                          <span className="text-[10px] font-black px-3 py-1 bg-surface/80 rounded-full tracking-widest text-muted-foreground group-hover:text-foreground transition-colors border border-border">
                            {action.tag}
                          </span>
                        </div>
                        <h4 className="text-2xl font-black mb-2 group-hover:translate-x-1 transition-transform duration-500">{action.label}</h4>
                        <p className="text-muted-foreground group-hover:text-foreground transition-colors">{action.description}</p>
                      </div>

                      <div className="relative z-10 mt-12 flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                        GO TO SERVICE <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── Recent Activity & Alerts ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 md:mb-20">
              {/* Active Bookings */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Clock className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black tracking-tight">Recent <span className="text-primary">Activity</span></h3>
                </div>
                
                <div className="space-y-4">
                  {bookings?.slice(0, 3).map((booking: any, idx: number) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-3xl bg-surface/30 border border-border/50 flex items-center justify-between hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          {booking.service_type === 'vehicle' ? <Car className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground uppercase">{booking.service_type} RENTAL</p>
                          <p className="text-xs text-muted-foreground">ID: {booking.id.slice(0, 8)} • {new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground">₹{Number(booking.total_amount).toLocaleString()}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {(!bookings || bookings.length === 0) && (
                    <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-[2.5rem]">
                       <p className="text-sm text-muted-foreground font-medium">No recent bookings found.</p>
                       <Button variant="link" className="text-primary font-bold text-xs">Start Exploring</Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts / Notifications */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-xl bg-accent/10 text-accent">
                      <Bell className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black tracking-tight text-accent">Alerts</h3>
                </div>

                <div className="space-y-4">
                  {notifications?.slice(0, 4).map((n, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-4 rounded-2xl border flex gap-3 ${n.is_read ? 'bg-surface/10 border-border/30 opacity-50' : 'bg-accent/5 border-accent/20'}`}
                    >
                      <div className="mt-1">
                        {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Info className="w-4 h-4 text-accent" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground leading-tight mb-1">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </motion.div>
                  ))}
                  {(!notifications || notifications.length === 0) && (
                    <div className="py-10 text-center bg-surface/20 rounded-3xl border border-border/50">
                       <p className="text-xs text-muted-foreground font-medium italic">All caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Featured Section ────────────────────────── */}
            <section>
               <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-surface to-background border border-border relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity duration-700">
                    <Star className="w-32 h-32 md:w-64 md:h-64 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-primary text-[10px] md:text-xs font-black tracking-widest uppercase mb-3 md:mb-4 block">LIMITED OFFER</span>
                    <h3 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 leading-tight">Upgrade your campus experience.</h3>
                    <p className="text-muted-foreground max-w-md mb-6 md:mb-8 text-sm md:text-base">Get exclusive access to premium PGs and luxury vehicle rentals with priority booking.</p>
                    <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-black px-6 md:px-10 h-12 md:h-14 rounded-xl md:rounded-2xl transition-all text-sm md:text-base tap-feedback shadow-xl shadow-primary/20">
                      <Link href="/houses">LEARN MORE</Link>
                    </Button>
                  </div>
               </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
