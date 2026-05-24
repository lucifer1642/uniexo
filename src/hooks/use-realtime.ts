import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type RealtimeTable = 'bookings' | 'vehicles' | 'houses' | 'wallets' | 'laundry_orders' | 'marketplace_items' | 'profiles';

export const useRealtimeSync = (tables: RealtimeTable[], queryKeys: string[][]) => {
  const queryClient = useQueryClient();

  const tablesStr = JSON.stringify(tables);
  const queryKeysStr = JSON.stringify(queryKeys);

  useEffect(() => {
    const activeTables = JSON.parse(tablesStr) as RealtimeTable[];
    const activeKeys = JSON.parse(queryKeysStr) as string[][];

    if (!activeTables.length) return;

    console.log(`[REALTIME] Subscribing to: ${activeTables.join(', ')}`);

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table as RealtimeTable;
          if (activeTables.includes(table)) {
            console.log(`[REALTIME] Change detected in ${table}:`, payload.eventType);
            
            // Invalidate the provided query keys
            activeKeys.forEach(key => {
              queryClient.invalidateQueries({ queryKey: key });
            });
            
            // Also invalidate global dashboard stats if relevant
            queryClient.invalidateQueries({ queryKey: ['vendorDashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['vendorAnalyticsOverview'] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Successfully subscribed to channel');
        }
      });

    return () => {
      console.log('[REALTIME] Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [tablesStr, queryKeysStr, queryClient]);
};
