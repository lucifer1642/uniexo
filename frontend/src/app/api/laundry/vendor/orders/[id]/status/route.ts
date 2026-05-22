import { NextResponse } from 'next/server';
import { notificationService } from '@/modules/email/notification.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!status) return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });

    const result = await laundryService.updateOrderStatus(id, status);
    
    if (result.success) {
      // Find order + user to notify
      const { data: order } = await supabaseAdmin
        .from('laundry_orders')
        .select('user_id, profiles:user_id(email, name)')
        .eq('id', id)
        .maybeSingle();
      
      if (order && order.profiles) {
        notificationService.onOrderStatusUpdate(
          order.user_id,
          (order.profiles as any).email,
          id,
          status
        ).catch(() => {});
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
