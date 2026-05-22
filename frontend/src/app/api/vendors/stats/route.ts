import { NextResponse } from 'next/server';
import { vendorService } from '@/modules/vendor/vendor.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });

    const result = await vendorService.getStats(vendorId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
