'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, ShoppingBag } from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'ORD-1092',
    date: 'Oct 24, 2026',
    status: 'Delivered',
    type: 'laundry',
    items: 'Premium Wash & Fold (2 loads)',
    total: 30.00,
  },
  {
    id: 'ORD-1085',
    date: 'Oct 15, 2026',
    status: 'Completed',
    type: 'marketplace',
    items: 'Vintage Leather Sofa',
    total: 340.00,
  },
];

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Orders</h1>
            <p className="text-muted-foreground">View your marketplace purchases and laundry service history.</p>
          </div>
        </div>

        <div className="space-y-4">
          {MOCK_ORDERS.map((order) => (
            <Card key={order.id} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                      order.type === 'laundry' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {order.type === 'laundry' ? <Package className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{order.id}</span>
                        <Badge variant="outline" className={order.status === 'Delivered' || order.status === 'Completed' ? 'border-primary/30 text-primary' : ''}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-foreground font-medium mb-1">{order.items}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" /> {order.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {MOCK_ORDERS.length === 0 && (
            <div className="text-center py-20 border rounded-2xl border-dashed">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No orders yet</h3>
              <p className="text-muted-foreground">When you buy items or book laundry services, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
