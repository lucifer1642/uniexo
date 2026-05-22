import { NextResponse } from 'next/server';
import { marketplaceService } from '@/modules/marketplace/marketplace.service';
import { notificationService } from '@/modules/email/notification.service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const result = await marketplaceService.updateOfferStatus(id, status);

    if (result.success && result.data) {
      // Notify buyer
      notificationService.notify({
        userId: result.data.buyer_id,
        title: `Offer ${status.toUpperCase()}`,
        message: `Your offer for the item has been ${status}.`,
        type: status === 'accepted' ? 'success' : 'warning'
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
