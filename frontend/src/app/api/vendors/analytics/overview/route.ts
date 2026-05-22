import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  return NextResponse.json({
    success: true,
    data: {
      totalRevenue: 0,
      totalBookings: 0,
      activeListings: 0,
      averageRating: 0,
      revenueChange: 0,
      bookingsChange: 0
    }
  });
}
