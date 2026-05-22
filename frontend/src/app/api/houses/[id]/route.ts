import { NextResponse } from 'next/server';
import { houseService } from '@/modules/house/house.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await houseService.getById(id);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API HOUSE GET] Error:', err);
    return NextResponse.json({ success: false, error: 'Property not found.' }, { status: 200 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const vendorId = url.searchParams.get('vendorId');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required.' }, { status: 200 });
    }
    const result = await houseService.delete(id, vendorId);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API HOUSE DELETE] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete property.' }, { status: 200 });
  }
}
