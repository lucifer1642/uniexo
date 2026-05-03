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
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Dashboard() {
  const { user } = useAuthStore();
  const { openProfileSidebar, isProfileSidebarOpen } = useUIStore();

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
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white relative font-sans overflow-x-hidden has-bottom-nav md:pb-0">
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
            y: [0, 25, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-lime-500/5 rounded-full blur-[80px] md:blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, -50, 0],
            y: [0, -25, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-600/5 rounded-full blur-[80px] md:blur-[100px]"
        />
      </div>

      <div className="relative z-10 flex w-full">
        <main className="flex-1 transition-all duration-500 ease-in-out">
          <div className="container mx-auto px-4 py-6 md:px-6 lg:px-12 md:py-12 max-w-6xl">
            
            {/* ── Header Section ─────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-8 md:mb-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-1 md:mb-2">
                   <div className="h-1 w-6 md:w-8 bg-lime-400 rounded-full" />
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-lime-400/70">DASHBOARD OVERVIEW</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                  Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500">{user?.name?.split(' ')[0]}</span>
                </h1>
                <p className="text-zinc-500 mt-2 md:mt-4 font-medium text-sm md:text-lg max-w-md">Access premium services and manage your campus lifestyle.</p>
              </motion.div>

              <div className="flex items-center gap-3 md:gap-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden md:flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2 px-4 rounded-2xl backdrop-blur-3xl shadow-2xl"
                >
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-zinc-600"
                  />
                </motion.div>
                
                <Button 
                  onClick={openProfileSidebar}
                  variant="outline"
                  className={`hidden md:flex h-14 w-14 rounded-2xl border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all ${isProfileSidebarOpen ? 'border-lime-400/50 text-lime-400' : 'hover:border-lime-400/30'}`}
                >
                  <User className="w-6 h-6" />
                </Button>
              </div>
            </header>

            {/* ── Quick Services ──────────────────────────── */}
            <section className="mb-10 md:mb-20">
              <div className="flex items-center justify-between mb-5 md:mb-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-lime-400/10 text-lime-400">
                    <LayoutGrid className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tight">Quick <span className="text-lime-400">Services</span></h2>
                </div>
                <Button asChild variant="ghost" className="text-zinc-500 hover:text-white transition-colors group text-xs md:text-sm">
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
                      className="relative overflow-hidden p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 active:border-white/15 transition-all duration-300 h-full flex flex-col justify-between min-h-[200px]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-30`} />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-4 rounded-2xl bg-white/[0.05] ${action.iconColor} shadow-xl`}>
                            <action.icon className="w-8 h-8" />
                          </div>
                          <span className="text-[9px] font-black px-2.5 py-1 bg-white/[0.08] rounded-full tracking-widest text-zinc-400">
                            {action.tag}
                          </span>
                        </div>
                        <h4 className="text-xl font-black mb-1">{action.label}</h4>
                        <p className="text-zinc-500 text-sm">{action.description}</p>
                      </div>

                      <div className="relative z-10 mt-6 flex items-center gap-2 text-xs font-bold text-lime-400">
                        GO TO SERVICE <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                      
                      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/[0.02] rounded-full blur-xl" />
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
                      className="relative overflow-hidden p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 h-full flex flex-col justify-between"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-5 rounded-3xl bg-white/[0.03] ${action.iconColor} group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
                            <action.icon className="w-10 h-10" />
                          </div>
                          <span className="text-[10px] font-black px-3 py-1 bg-white/[0.05] rounded-full tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                            {action.tag}
                          </span>
                        </div>
                        <h4 className="text-2xl font-black mb-2 group-hover:translate-x-1 transition-transform duration-500">{action.label}</h4>
                        <p className="text-zinc-500 group-hover:text-zinc-300 transition-colors">{action.description}</p>
                      </div>

                      <div className="relative z-10 mt-12 flex items-center gap-2 text-sm font-bold text-lime-400 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                        GO TO SERVICE <ChevronRight className="w-4 h-4" />
                      </div>
                      
                      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl group-hover:bg-white/[0.05] transition-all duration-500" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── Featured Section ────────────────────────── */}
            <section>
               <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 md:p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
                    <Star className="w-32 h-32 md:w-64 md:h-64 text-white" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-lime-400 text-[10px] md:text-xs font-black tracking-widest uppercase mb-3 md:mb-4 block">LIMITED OFFER</span>
                    <h3 className="text-2xl md:text-4xl font-black mb-3 md:mb-4 leading-tight">Upgrade your campus experience.</h3>
                    <p className="text-zinc-500 max-w-md mb-6 md:mb-8 text-sm md:text-base">Get exclusive access to premium PGs and luxury vehicle rentals with priority booking.</p>
                    <Button asChild className="bg-white text-black hover:bg-lime-400 hover:text-black font-black px-6 md:px-10 h-12 md:h-14 rounded-xl md:rounded-2xl transition-all text-sm md:text-base tap-feedback">
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
