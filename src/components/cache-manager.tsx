'use client';

import { useEffect } from 'react';

const CACHE_VERSION = 'v3'; // Bump this to force a one-time clear on next deploy

export function CacheManager() {
  useEffect(() => {
    // One-time clear per cache version — only runs when we deploy a new version
    const storedVersion = localStorage.getItem('cache_version');
    if (storedVersion !== CACHE_VERSION) {
      console.log(`[CacheManager] New version ${CACHE_VERSION}, clearing stale data...`);
      // Only clear our own keys — do NOT wipe uniexo-auth-storage so logged-in users stay logged in
      const keysToKeep = ['uniexo-auth-storage', 'cache_version'];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
      localStorage.setItem('cache_version', CACHE_VERSION);
      console.log('[CacheManager] Stale cache cleared.');
    }
  }, []);

  return null;
}
