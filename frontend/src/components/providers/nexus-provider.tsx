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

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<NexusPulseStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    // Determine socket URL based on environment API URL
    const socketUrl = 
      process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/$/, '') || 
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 
      'http://localhost:5000';

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
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
