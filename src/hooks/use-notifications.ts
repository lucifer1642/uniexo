import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/modules/auth/auth.store';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'kyc_update' | 'booking_reminder' | 'payment_due' | 'booking_confirmed' | 'payment_received' | 'order_update';
  is_read: boolean;
  metadata?: any;
  created_at: string;
  // Compatibility aliases for existing UI
  _id: string;
  isRead: boolean;
  createdAt: string;
}

function mapNotification(n: any): Notification {
  return {
    ...n,
    _id: n.id,
    isRead: n.is_read,
    createdAt: n.created_at,
  };
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        const json = await res.json();
        return (json.data || []).map(mapNotification);
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
    enabled: isAuthenticated && !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await fetch(`/api/notifications?userId=${user.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
