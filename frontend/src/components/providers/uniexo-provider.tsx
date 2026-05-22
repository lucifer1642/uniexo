'use client';

import { createContext, useContext } from 'react';

interface UniExoPulseStats {
  liveUsers: number;
  authenticatedUsers: number;
  pages: Record<string, number>;
  timestamp: string;
}

interface UniExoContextType {
  socket: any | null;
  stats: UniExoPulseStats | null;
  isConnected: boolean;
}

const UniExoContext = createContext<UniExoContextType>({
  socket: null,
  stats: null,
  isConnected: false,
});

export const useUniExo = () => useContext(UniExoContext);

export function UniExoProvider({ children }: { children: React.ReactNode }) {
  return (
    <UniExoContext.Provider value={{ socket: null, stats: null, isConnected: false }}>
      {children}
    </UniExoContext.Provider>
  );
}

