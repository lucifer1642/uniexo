import { NextResponse } from 'next/server';
import { intelligenceService } from '@/modules/intelligence/intelligence.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await intelligenceService.trackHeartbeat(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
