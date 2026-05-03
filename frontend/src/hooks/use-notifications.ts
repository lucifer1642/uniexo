import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger' | 'kyc_update' | 'booking_reminder' | 'payment_due';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/users/notifications');
      return response.data.data;
    },
    refetchInterval: 60000,
    // CRITICAL: Only fetch when user is logged in — otherwise it fires 401s
    // which trigger the redirect interceptor → infinite reload loop
    enabled: isAuthenticated,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/users/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.post('/users/notifications/read-all');
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
  };
}
