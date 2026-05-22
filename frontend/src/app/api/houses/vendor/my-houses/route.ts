import { NextResponse } from 'next/server';
import { houseService } from '@/modules/house/house.service';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const result = await houseService.listByVendor(user.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API VENDOR HOUSES GET] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch properties.' }, { status: 200 });
  }
}, 'vendor');
