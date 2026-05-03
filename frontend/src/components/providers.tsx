'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ── Caching for scalability ────────────────────────
            staleTime: 2 * 60 * 1000,       // Data is fresh for 2 minutes (reduces refetches)
            gcTime: 10 * 60 * 1000,          // Keep unused data in cache for 10 minutes
            refetchOnWindowFocus: false,      // Don't refetch when user switches tabs
            refetchOnReconnect: 'always',     // Always refetch when network reconnects
            retry: 2,                         // Retry failed requests twice
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff: 1s, 2s, 4s...
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
