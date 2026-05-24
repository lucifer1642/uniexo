'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Eye, Trash2, Calendar, ShieldCheck, CreditCard, 
  Settings, Info, ShieldAlert, ArrowLeft, Inbox, CircleDot
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'bookings' | 'payments' | 'kyc'>('all');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_reminder':
        return { icon: Calendar, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'payment_due':
      case 'payment_received':
        return { icon: CreditCard, bg: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'kyc_update':
        return { icon: ShieldCheck, bg: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'warning':
      case 'danger':
        return { icon: ShieldAlert, bg: 'bg-rose-50 text-rose-600 border-rose-100' };
      default:
        return { icon: Info, bg: 'bg-blue-50 text-blue-600 border-blue-100' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings') return n.type?.includes('booking');
    if (filter === 'payments') return n.type?.includes('payment');
    if (filter === 'kyc') return n.type?.includes('kyc');
    return true;
  });

  const handleMarkAllRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read')
    });
  };

  const handleMarkSingleRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-8 theme-landing">
      <div className="max-w-[768px] mx-auto px-4 py-6 md:py-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2.5 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications</h1>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread message(s)` : 'Your inbox is up to date'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs font-bold border-slate-200 hover:bg-white rounded-full px-4 h-9 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
          {(['all', 'unread', 'bookings', 'payments', 'kyc'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-5 py-2.5 rounded-full border text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filter === type 
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {type === 'all' ? 'All Updates' : type}
            </button>
          ))}
        </div>

        {/* List of Notifications */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white border border-slate-200/60 rounded-[2rem] shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Inbox is empty</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1 font-medium">
                {filter === 'all' 
                  ? 'No notifications at this time.' 
                  : `No ${filter} notifications found.`}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => {
                const config = getNotificationIcon(notif.type);
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  >
                    <Card className={`overflow-hidden border-slate-200/60 shadow-sm transition-all hover:shadow-md rounded-2xl bg-white relative ${!notif.isRead ? 'ring-1 ring-primary/10' : ''}`}>
                      <CardContent className="p-5 flex gap-4">
                        {/* Dot indicator */}
                        {!notif.isRead && (
                          <div className="absolute top-5 right-5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </div>
                        )}

                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Text Details */}
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-sm font-bold text-slate-900 ${!notif.isRead ? 'font-extrabold' : ''}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed mt-1 font-medium">
                            {notif.message}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-400 mt-2.5 block uppercase tracking-wider">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Unread Interaction */}
                        {!notif.isRead && (
                          <div className="self-center">
                            <button
                              onClick={() => handleMarkSingleRead(notif.id)}
                              disabled={markAsRead.isPending}
                              className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-200/80 transition-all shrink-0"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        
      </div>
    </div>
  );
}
