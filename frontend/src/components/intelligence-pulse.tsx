'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useHeartbeat } from '@/hooks/use-intelligence';

export function IntelligencePulse() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mutate: sendHeartbeat } = useHeartbeat();

  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('uniexo_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('uniexo_session_id', sessionId);
    }

    const interval = setInterval(() => {
      sendHeartbeat({
        userId: user?.id,
        campus: 'Main Campus', // Ideally get from user profile or geofencing
        currentPage: pathname,
        sessionId: sessionId!
      });
    }, 30000); // Pulse every 30s

    return () => clearInterval(interval);
  }, [user, pathname, sendHeartbeat]);

  return null;
}
