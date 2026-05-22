import { NextResponse } from 'next/server';
import { laundryService } from '@/modules/laundry/laundry.service';
import { withAuth } from '@/lib/api-auth';

export const GET = withAuth(async (req: Request, user: any) => {
  try {
    const result = await laundryService.getUserOrders(user.userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, user: any) => {
  try {
    const body = await req.json();
    // Force user ID from token
    const result = await laundryService.createOrder({ ...body, userId: user.userId });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
