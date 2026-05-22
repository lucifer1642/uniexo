import { supabaseAdmin } from '@/lib/supabase-admin';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'booking' | 'payment' | 'system';

export const notificationService = {
  async createNotification(input: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: any;
  }) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'info',
        metadata: input.metadata || {},
        is_read: false
      })
      .select()
      .single();
    
    return { success: !error, data, error: error?.message };
  },

  async getUserNotifications(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    return { success: !error, data: data || [], error: error?.message };
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    return { success: !error, error: error?.message };
  }
};
