import { NextResponse } from 'next/server';
import { marketplaceService } from '@/modules/marketplace/marketplace.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: type } = await params;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) return NextResponse.json({ success: true, data: [] });

    const result = await marketplaceService.getMyOffers(userId, type as 'buyer' | 'seller');
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
