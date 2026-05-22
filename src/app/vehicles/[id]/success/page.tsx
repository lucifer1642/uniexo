'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
        <p className="text-muted-foreground mb-8">
          Your payment was successful and your booking has been secured. You can view the details in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
