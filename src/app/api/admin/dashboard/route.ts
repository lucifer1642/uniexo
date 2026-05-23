import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req, user) => {
  if (user.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  
  try {
    const [usersCount, vendorsCount, bookingsCount, rev] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'),
      supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('bookings').select('total_amount').eq('status', 'completed')
    ]);
    
    const totalRevenue = (rev.data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: usersCount.count || 0,
        totalVendors: vendorsCount.count || 0,
        totalBookings: bookingsCount.count || 0,
        totalRevenue,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});