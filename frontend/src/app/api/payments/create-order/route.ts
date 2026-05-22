import { NextResponse } from 'next/server';
import { paymentService } from '@/modules/checkout/payment.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, serviceType, referenceId, amount } = body;

    if (!userId || !referenceId || !amount) {
      return NextResponse.json({ success: false, error: 'Missing required payment fields.' }, { status: 200 });
    }

    const result = await paymentService.createOrder({ userId, serviceType, referenceId, amount });
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[API PAYMENT CREATE] Error:', err);
    return NextResponse.json({ success: false, error: 'Failed to create payment order.' }, { status: 200 });
  }
}
