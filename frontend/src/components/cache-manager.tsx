'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function CacheManager() {
  useEffect(() => {
    // 1. Clear cache on initial load (only once per session)
    const hasCleared = sessionStorage.getItem('initial_cache_cleared');
    if (!hasCleared) {
      console.log('🔄 Initial cache clearing protocol initiated...');
      
      // Clear specific auth tokens that might be stale
      // We don't want to clear EVERYTHING if the user is already logged in with the NEW system,
      // but the user asked to clear "browser cache once opened".
      // To be safe and meet the requirement:
      localStorage.clear();
      sessionStorage.clear();
      
      sessionStorage.setItem('initial_cache_cleared', 'true');
      
      // If we cleared localStorage, we need to reset the auth store
      useAuthStore.getState().logout();
      
      console.log('✅ Initial cache cleared.');
    }

    // 2. Set interval to clear every 10 minutes
    const interval = setInterval(() => {
      console.log('🕒 10-minute periodic cache clear initiated...');
      
      // Note: This will log out the user every 10 minutes.
      localStorage.clear();
      useAuthStore.getState().logout();
      
      console.log('✅ Periodic cache cleared.');
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
