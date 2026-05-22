import { NextResponse } from 'next/server';
import { intelligenceService } from '@/modules/intelligence/intelligence.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });

    const result = await intelligenceService.getSurgeSuggestions(vendorId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
