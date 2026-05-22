import { NextResponse } from 'next/server';
import { marketplaceService } from '@/modules/marketplace/marketplace.service';
import { notificationService } from '@/modules/email/notification.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, buyerId, offeredPrice, message } = body;

    const result = await marketplaceService.createOffer({
      itemId, buyerId, offeredPrice, message
    });

    if (result.success && result.data) {
      // Notify seller
      notificationService.notify({
        userId: result.data.seller_id,
        title: 'New Offer Received',
        message: `You received an offer of ₹${offeredPrice} for your item.`,
        type: 'info'
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
