'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useNotifications } from '@/hooks/use-notifications';

const PUSH_PERMISSION_KEY = 'uniexo_push_permission_asked';

export function PushNotificationProvider() {
  const { isAuthenticated } = useAuthStore();
  const { notifications, unreadCount } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

  // Show permission banner after login if not already asked
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;
    
    const alreadyAsked = localStorage.getItem(PUSH_PERMISSION_KEY);
    if (alreadyAsked) return;
    
    // Check if browser supports notifications
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;

    // Show banner after a short delay (let the dashboard load first)
    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Send native notifications for new unread items
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!notifications.length) return;

    const latest = notifications[0];
    if (!latest || latest.isRead) return;
    if (latest._id === lastNotifiedId) return;

    setLastNotifiedId(latest._id);

    try {
      new Notification('UniExo', {
        body: `${latest.title}: ${latest.message}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: latest._id,
        silent: false,
      });
    } catch (e) {
      // Notification constructor may fail in some contexts
      console.warn('Push notification failed:', e);
    }
  }, [notifications, lastNotifiedId]);

  const handleAllow = useCallback(async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
      setShowBanner(false);

      if (permission === 'granted') {
        new Notification('UniExo', {
          body: "You'll now receive real-time alerts for bookings, KYC, and payments.",
          icon: '/favicon.ico',
        });
      }
    } catch {
      localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
      setShowBanner(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(PUSH_PERMISSION_KEY, 'true');
    setShowBanner(false);
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-sm z-[9998]"
        >
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 md:p-5 shadow-[0_0_60px_-10px_rgba(163,230,53,0.15)] backdrop-blur-xl">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-zinc-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white mb-1">Stay in the loop</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Get instant alerts for bookings, KYC updates, and payments.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAllow}
                    size="sm"
                    className="bg-lime-400 text-black hover:bg-lime-300 font-black text-xs rounded-lg h-8 px-4 tap-feedback"
                  >
                    Enable
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-white text-xs font-bold h-8 px-3"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
