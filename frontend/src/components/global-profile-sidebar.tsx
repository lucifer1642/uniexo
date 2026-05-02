'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  Clock, 
  Zap,
  ShieldCheck,
  User,
  ChevronRight,
  History,
  LogOut,
  Settings,
  ShoppingBasket,
  Car,
  Home,
  ShoppingBag,
  WashingMachine,
  LayoutGrid,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { KycUploadDialog } from './kyc-upload-dialog';

const SERVICE_LINKS = [
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/houses', label: 'Rooms', icon: Home },
  { href: '/marketplace', label: 'Used Items', icon: ShoppingBag },
  { href: '/laundry', label: 'Laundry', icon: WashingMachine },
];

export function GlobalProfileSidebar() {
  const { isProfileSidebarOpen: isOpen, closeProfileSidebar: onClose } = useUIStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isKycDialogOpen, setIsKycDialogOpen] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      toast.success('Logged out successfully');
      onClose();
      router.push('/login');
    }
  };

  const stats = [
    { label: 'Wallet Balance', value: '₹0.00', icon: WalletIcon },
    { label: 'Active Bookings', value: '0', icon: Clock },
    { label: 'Saved Items', value: '0', icon: Zap },
    { 
      label: 'KYC Status', 
      value: user?.kycStatus === 'approved' ? 'Verified' : user?.kycStatus === 'pending' ? 'Reviewing' : 'Required', 
      icon: ShieldCheck,
      color: user?.kycStatus === 'approved' ? 'text-emerald-400' : user?.kycStatus === 'pending' ? 'text-amber-400' : 'text-zinc-500'
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative h-full w-full lg:w-[400px] bg-[#0a0a0a] border-l border-white/5 shadow-[-20px_0_100px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-2xl font-black tracking-tight text-white italic">Nexus <span className="text-lime-400">Control</span></h2>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="rounded-full hover:bg-white/5 text-zinc-400"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>

                {/* User Header */}
                <div className="flex flex-col items-center text-center mb-12">
                  <div className="relative mb-4 group">
                      <div className={`absolute -inset-1 bg-gradient-to-r ${user.kycStatus === 'approved' ? 'from-emerald-400 to-teal-500' : 'from-lime-400 to-emerald-500'} rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000`} />
                      <Avatar className="h-24 w-24 border-2 border-black relative">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-zinc-900 text-2xl font-bold text-white">{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {user.kycStatus === 'approved' && (
                        <div className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-black rounded-full border-2 border-black">
                           <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">{user?.name}</h3>
                    {user.kycStatus === 'approved' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-zinc-500 text-sm">{user?.email}</p>
                  
                  {user.kycStatus !== 'approved' ? (
                    <button 
                      onClick={() => setIsKycDialogOpen(true)}
                      className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 text-amber-400 bg-amber-400/5 uppercase tracking-tighter text-[10px] font-bold hover:bg-amber-400/10 transition-colors"
                    >
                       <AlertCircle className="w-3 h-3" />
                       Verification Required
                    </button>
                  ) : (
                    <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full border border-emerald-400/30 text-emerald-400 bg-emerald-400/5 uppercase tracking-tighter text-[10px] font-bold">
                       <CheckCircle className="w-3 h-3 mr-2" />
                       Verified Member
                    </div>
                  )}
                </div>

                {/* Service Navigation */}
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6 text-zinc-400">
                      <LayoutGrid className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Access Services</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      {SERVICE_LINKS.map((service) => (
                        <Link 
                          key={service.href} 
                          href={service.href} 
                          onClick={onClose}
                          className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-lime-400/30 hover:bg-lime-400/5 transition-all group"
                        >
                          <service.icon className="w-6 h-6 mb-3 text-zinc-500 group-hover:text-lime-400 transition-colors" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">{service.label}</span>
                        </Link>
                      ))}
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-2 mb-12">
                  <Link href="/dashboard" onClick={onClose} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-lime-400 transition-colors">
                            <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-zinc-300">User Dashboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </Link>
                  <Link href="/orders" onClick={onClose} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-lime-400 transition-colors">
                            <ShoppingBasket className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-zinc-300">Order History</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </Link>
                  <Link href="/profile" onClick={onClose} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.05] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/[0.03] text-zinc-400 group-hover:text-lime-400 transition-colors">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-zinc-300">Profile & KYC</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-lime-400 transition-colors" />
                  </Link>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:border-lime-400/20 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-zinc-500">
                        <stat.icon className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <div className={`text-lg font-black transition-colors ${stat.color || 'text-white group-hover:text-lime-400'}`}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity Section */}
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6 text-zinc-400">
                      <History className="w-4 h-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Recent Activity</h4>
                  </div>
                  <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                        <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600">No recent activity detected.</p>
                      </div>
                  </div>
                </div>

                {/* Become a Vendor CTA */}
                <Link href="/signup?role=vendor" onClick={onClose}>
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-lime-500 to-green-700 text-black relative overflow-hidden group shadow-2xl">
                    <Zap className="absolute -right-8 -bottom-8 w-32 h-32 text-white/20 group-hover:scale-110 transition-transform duration-700" />
                    <h4 className="text-2xl font-black leading-none mb-2">Become a <br />Vendor</h4>
                    <p className="text-sm font-medium mb-6 opacity-80">Start earning by listing your services today.</p>
                    <div className="w-full bg-black text-white flex items-center justify-center font-bold rounded-xl h-12 shadow-xl group-hover:bg-zinc-900 transition-colors">
                        GET STARTED
                    </div>
                  </div>
                </Link>
              </div>

              {/* Bottom Actions */}
              <div className="p-8 border-t border-white/5 bg-black/40">
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="w-full text-zinc-500 hover:text-red-400 transition-colors font-black tracking-widest text-[10px] gap-2"
                >
                    <LogOut className="w-3 h-3" />
                    LOG OUT FROM SESSION
                </Button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <KycUploadDialog 
        isOpen={isKycDialogOpen} 
        onClose={() => setIsKycDialogOpen(false)} 
      />
    </>
  );
}
