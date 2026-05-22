import { NextResponse } from 'next/server';
import { fleetService } from '@/modules/vehicle/fleet.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 200 });

    const result = await fleetService.getFleet(vendorId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API FLEET GET] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch fleet.' }, { status: 200 });
  }
}
