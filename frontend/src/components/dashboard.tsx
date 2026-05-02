'use client';

import { motion } from 'framer-motion';
import { 
  Car, 
  Home, 
  ShoppingBag, 
  WashingMachine, 
  Wallet as WalletIcon, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Bell,
  Search
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Dashboard() {
  const { user } = useAuthStore();

  const stats = [
    { label: 'Wallet Balance', value: '₹0.00', icon: WalletIcon, color: 'lime' },
    { label: 'Active Bookings', value: '0', icon: Clock, color: 'blue' },
    { label: 'Saved Items', value: '0', icon: Zap, color: 'orange' },
    { label: 'KYC Status', value: 'Pending', icon: ShieldCheck, color: 'purple' },
  ];

  const quickActions = [
    { label: 'Rent a Vehicle', icon: Car, href: '/vehicles', description: 'Cars, Bikes & Scooters' },
    { label: 'Find a Room', icon: Home, href: '/houses', description: 'PGs, Hostels & Flats' },
    { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace', description: 'Buy & Sell Used Items' },
    { label: 'Laundry Service', icon: WashingMachine, href: '/laundry', description: 'Wash, Fold & Dry' },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-lime-500/30 selection:text-lime-200 overflow-hidden relative">
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
              Welcome back, <span className="text-lime-400">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-zinc-400 mt-1 font-medium">Here's what's happening today in your network.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-2 rounded-2xl backdrop-blur-xl"
          >
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-lime-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search services..." 
                className="bg-transparent border-none focus:ring-0 text-sm pl-10 pr-4 py-2 w-48 md:w-64 placeholder:text-zinc-600"
              />
            </div>
            <button className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-lime-500 rounded-full border-2 border-black"></span>
            </button>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl group transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white/[0.05] text-lime-400 group-hover:bg-lime-400 group-hover:text-black transition-all duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-zinc-600" />
              </div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-black mt-1 group-hover:text-lime-400 transition-colors">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">Quick <span className="text-lime-400">Services</span></h2>
              <Link href="/explore" className="text-sm font-bold text-zinc-500 hover:text-lime-400 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 p-6 rounded-3xl flex items-center gap-5 hover:border-lime-500/30 transition-all group"
                  >
                    <div className="p-4 rounded-2xl bg-white/[0.05] text-lime-400 group-hover:scale-110 transition-transform">
                      <action.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold group-hover:text-lime-400 transition-colors">{action.label}</h4>
                      <p className="text-sm text-zinc-500">{action.description}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity / Announcements */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black tracking-tight mb-6">Recent <span className="text-lime-400">Activity</span></h2>
            <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-6 h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mb-4 text-zinc-600">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-zinc-400 font-medium">No recent transactions or bookings found.</p>
              <p className="text-zinc-600 text-sm mt-1">Start exploring UniExo to see your activity here!</p>
              <Button asChild className="mt-6 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl px-8 shadow-[0_0_20px_-5px_rgba(163,230,53,0.3)]">
                <Link href="/vehicles">Explore Now</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Promotional Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-lime-500 to-green-700 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700">
            <Zap className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter leading-none mb-4">
              Become a <span className="text-white">Vendor</span> Today
            </h2>
            <p className="text-green-100 text-lg font-medium mb-8">
              List your assets and start earning. Car rentals, property listings, or marketplace items — we've got you covered.
            </p>
            <Button size="lg" className="bg-black text-white hover:bg-zinc-900 font-bold rounded-2xl px-10 h-14 text-lg">
              Get Started
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
