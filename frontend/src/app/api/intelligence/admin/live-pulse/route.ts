import { NextResponse } from 'next/server';
import { intelligenceService } from '@/modules/intelligence/intelligence.service';

export async function GET() {
  try {
    const result = await intelligenceService.getLivePulse();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
