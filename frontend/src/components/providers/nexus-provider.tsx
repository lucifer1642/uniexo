'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { usePathname } from 'next/navigation';

interface NexusPulseStats {
  liveUsers: number;
  authenticatedUsers: number;
  pages: Record<string, number>;
  timestamp: string;
}

interface NexusContextType {
  socket: Socket | null;
  stats: NexusPulseStats | null;
  isConnected: boolean;
}

const NexusContext = createContext<NexusContextType>({
  socket: null,
  stats: null,
  isConnected: false,
});

export const useNexus = () => useContext(NexusContext);

const resolveSocketUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/api\/v1\/?$/, '');

  if (!configured) {
    return 'http://localhost:5000';
  }

  try {
    const url = new URL(configured);
    const isFrontendPreview =
      url.hostname.includes('frontend') && url.hostname.endsWith('.vercel.app');

    if (typeof window !== 'undefined' && isFrontendPreview && url.origin !== window.location.origin) {
      console.warn(
        `[Nexus] Skipping socket connection to ${url.origin}; it looks like a frontend deployment, not the backend.`,
      );
      return null;
    }

    return url.origin;
  } catch {
    return configured.replace(/\/$/, '');
  }
};

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<NexusPulseStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    const socketUrl = resolveSocketUrl();

    // Only connect if we have a valid external origin or are on localhost
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (!socketUrl || (!socketUrl.startsWith('http') && !isLocal)) {
      console.warn('[Nexus] Skipping socket connection: Invalid origin');
      return;
    }

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 2, // Reduce spam
      timeout: 5000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[Nexus] Connected to command center');
    });

    newSocket.on('nexus_pulse', (data: NexusPulseStats) => {
      setStats(data);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Update presence on path or auth change
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('user_presence', {
        userId: user?.id,
        role: user?.role,
        page: pathname,
      });
    }
  }, [socket, isConnected, user, pathname]);

  return (
    <NexusContext.Provider value={{ socket, stats, isConnected }}>
      {children}
    </NexusContext.Provider>
  );
}
