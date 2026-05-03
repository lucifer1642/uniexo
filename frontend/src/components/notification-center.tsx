'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  ShieldCheck, 
  CreditCard,
  Circle,
  X
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
      case 'kyc_update':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'danger':
      case 'payment_due':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
      case 'kyc_update':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'danger':
      case 'payment_due':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const NotificationList = ({ onClose }: { onClose: () => void }) => (
    <>
      <div className="p-5 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400">
              <Bell className="w-4 h-4" />
           </div>
           <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Alerts</h4>
              <p className="text-[10px] text-zinc-500 font-bold">{unreadCount} UNREAD</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead.mutate()}
              className="text-[10px] font-black text-lime-400 hover:text-lime-300 uppercase tracking-tighter"
            >
              READ ALL
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="md:hidden h-8 w-8 rounded-full text-zinc-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[60vh] md:h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-700 mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <h5 className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Alerts</h5>
            <p className="text-xs text-zinc-600 mt-1 font-medium">No notifications at this time.</p>
          </div>
        ) : (
          <div className="p-2">
            {notifications.map((notification, idx) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => !notification.isRead && markAsRead.mutate(notification._id)}
                className={`group relative p-4 rounded-2xl transition-all cursor-pointer mb-1 min-h-[72px] ${notification.isRead ? 'opacity-60' : 'bg-white/[0.03] border border-white/5 hover:border-lime-400/20 hover:bg-white/[0.05]'}`}
              >
                <div className="flex gap-3 md:gap-4">
                  <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${getBg(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`text-sm font-black truncate ${notification.isRead ? 'text-zinc-400' : 'text-white'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                         <Circle className="w-2 h-2 fill-lime-400 text-lime-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
         <Button variant="ghost" className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white" asChild onClick={onClose}>
            <Link href="/dashboard">View All Activity</Link>
         </Button>
      </div>
    </>
  );

  const bellButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={isMobile ? () => setMobileOpen(true) : undefined}
      className="relative h-10 w-10 md:h-11 md:w-11 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/5 hover:border-lime-400/30 transition-all tap-feedback"
    >
      <Bell className={`w-4 h-4 md:w-5 md:h-5 ${unreadCount > 0 ? 'text-lime-400' : 'text-zinc-400'}`} />
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 flex h-2.5 w-2.5 md:h-3 md:w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-lime-500 border-2 border-[#0a0a0a]"></span>
        </span>
      )}
    </Button>
  );

  return (
    <>
      {/* Desktop: Popover */}
      <div className="hidden md:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {bellButton}
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 bg-[#0a0a0a] border-white/10 rounded-[2rem] shadow-2xl overflow-hidden" align="end">
            <NotificationList onClose={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Full-screen sheet */}
      <div className="md:hidden">
        {bellButton}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/10 rounded-t-[2rem] max-h-[85vh] overflow-hidden"
            >
              <div className="pt-3 pb-1">
                <div className="drag-indicator" />
              </div>
              <NotificationList onClose={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
