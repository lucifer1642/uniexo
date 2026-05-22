import { NextResponse } from 'next/server';
import { fleetService } from '@/modules/vehicle/fleet.service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const vendorId = body.vendorId;

    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 200 });

    const result = await fleetService.returnVehicle(id, vendorId, body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API RETURN] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to return vehicle.' }, { status: 200 });
  }
}
