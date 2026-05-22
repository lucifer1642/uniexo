import { NextResponse } from 'next/server';
import { laundryService } from '@/modules/laundry/laundry.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 });

    const result = await laundryService.getVendorService(vendorId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { vendorId, ...updates } = body;
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 });

    const result = await laundryService.updateVendorService(vendorId, updates);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
