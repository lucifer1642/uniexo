'use client';

import { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Clock, 
  ShieldCheck, 
  CreditCard,
  MoreVertical,
  Circle
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-11 w-11 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-lime-400/30 transition-all"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-lime-400 animate-pulse' : 'text-zinc-400'}`} />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500 border-2 border-[#0a0a0a]"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 bg-[#0a0a0a] border-white/10 rounded-[2rem] shadow-2xl overflow-hidden" align="end">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400">
                <Bell className="w-4 h-4" />
             </div>
             <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Alerts</h4>
                <p className="text-[10px] text-zinc-500 font-bold">{unreadCount} UNREAD TRANSMISSIONS</p>
             </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead.mutate()}
              className="text-[10px] font-black text-lime-400 hover:text-lime-300 uppercase tracking-tighter"
            >
              MARK ALL READ
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-700 mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h5 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Nexus Silent</h5>
              <p className="text-xs text-zinc-600 mt-1 font-medium">No system transmissions detected at this time.</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div 
                  key={notification._id}
                  onClick={() => !notification.isRead && markAsRead.mutate(notification._id)}
                  className={`group relative p-4 rounded-2xl transition-all cursor-pointer mb-1 ${notification.isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-white/[0.03] border border-white/5 hover:border-lime-400/20 hover:bg-white/[0.05]'}`}
                >
                  <div className="flex gap-4">
                    <div className={`mt-1 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${getBg(notification.type)}`}>
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
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
           <Button variant="ghost" className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white" asChild onClick={() => setOpen(false)}>
              <Link href="/dashboard">View Command Center History</Link>
           </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import Link from 'next/link';
