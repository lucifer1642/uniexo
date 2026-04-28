'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, ShoppingBag, Home, Car, Clock } from 'lucide-react';
import { useUserBookings } from '@/hooks/use-booking';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { data: bookingsData, isLoading } = useUserBookings();
  const bookings = bookingsData?.data || [];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Order History</h1>
            <p className="text-muted-foreground">View your rental bookings and marketplace purchases.</p>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
             <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl border-dashed bg-muted/20">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No history yet</h3>
              <p className="text-muted-foreground">When you book a house, vehicle or buy an item, they will appear here.</p>
            </div>
          ) : (
            bookings.map((booking: any) => (
              <Card key={booking._id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-all group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={`p-6 md:w-48 flex flex-col items-center justify-center gap-3 bg-muted/30 group-hover:bg-primary/5 transition-colors`}>
                       <div className={`p-4 rounded-full ${
                          booking.serviceType === 'house' ? 'bg-blue-500/10 text-blue-500' : 
                          booking.serviceType === 'vehicle' ? 'bg-orange-500/10 text-orange-500' : 
                          'bg-emerald-500/10 text-emerald-500'
                       }`}>
                          {booking.serviceType === 'house' ? <Home className="w-8 h-8" /> : 
                           booking.serviceType === 'vehicle' ? <Car className="w-8 h-8" /> : 
                           <Package className="w-8 h-8" />}
                       </div>
                       <Badge variant="outline" className="capitalize">
                          {booking.serviceType}
                       </Badge>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col md:flex-row justify-between gap-6">
                       <div className="space-y-3">
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-xl">{booking.serviceId?.title || booking.serviceId?.name || 'Booking Detail'}</h3>
                                <Badge className={`${
                                   booking.status === 'confirmed' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                   booking.status === 'pending' ? 'bg-amber-500 hover:bg-amber-600' :
                                   'bg-rose-500 hover:bg-rose-600'
                                } text-white border-none`}>
                                   {booking.status}
                                </Badge>
                             </div>
                             <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Booked on {format(new Date(booking.createdAt), 'PPP')}
                             </p>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                             <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-medium">{format(new Date(booking.startDate), 'MMM dd')} - {format(new Date(booking.endDate), 'MMM dd, yyyy')}</span>
                             </div>
                             {booking.totalMonths && (
                               <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-primary" />
                                  <span className="font-medium">{booking.totalMonths} Month Contract</span>
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="md:text-right flex flex-col justify-between">
                          <div>
                             <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Paid</p>
                             <p className="text-3xl font-bold text-primary">₹{booking.totalAmount?.toLocaleString()}</p>
                          </div>
                          <div className="mt-4 md:mt-0">
                             {booking.installments?.length > 0 && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                   {booking.installments.filter((i: any) => i.status === 'paid').length}/{booking.totalMonths} Paid
                                </Badge>
                             )}
                          </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
