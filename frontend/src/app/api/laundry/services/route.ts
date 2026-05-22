import { NextResponse } from 'next/server';
import { laundryService } from '@/modules/laundry/laundry.service';

export async function GET(req: Request) {
  try {
    const result = await laundryService.list({ isActive: true });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
