import { NextResponse } from 'next/server';
import { fleetService } from '@/modules/vehicle/fleet.service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const vendorId = body.vendorId;
    const isEntering = body.isEntering;

    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 200 });

    const result = await fleetService.toggleMaintenance(id, vendorId, isEntering);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API MAINTENANCE] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to toggle maintenance.' }, { status: 200 });
  }
}
