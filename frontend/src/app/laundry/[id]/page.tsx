'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { WashingMachine, MapPin, Shield, Check, User, Plus, Minus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLaundryService } from '@/hooks/use-laundry-services';
import { useCreateLaundryOrder } from '@/hooks/use-laundry-services';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/use-payment';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function LaundryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuthStore();
  
  const { data: service, isLoading, error } = useLaundryService(id);
  const createOrder = useCreateLaundryOrder();
  const createPayment = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  // Booking state
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pickupType, setPickupType] = useState<'onsite' | 'store'>('store');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Service Not Found</h2>
        <p className="text-muted-foreground mb-6">The laundry service you are looking for does not exist.</p>
        <Button onClick={() => router.push('/laundry')}>Back to Services</Button>
      </div>
    );
  }

  const updateQuantity = (serviceName: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[serviceName] || 0;
      const next = Math.max(0, current + delta);
      const newQuantities = { ...prev };
      if (next === 0) {
        delete newQuantities[serviceName];
      } else {
        newQuantities[serviceName] = next;
      }
      return newQuantities;
    });
  };

  const totalAmount = (service.services || []).reduce((total, s) => {
    return total + (s.price * (quantities[s.name] || 0));
  }, 0);

  const onsiteCharge = pickupType === 'onsite' ? (service.onsitePickupCharge || 0) : 0;
  const grandTotal = totalAmount + onsiteCharge;

  const selectedItemsCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleBookAndPay = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/laundry/${id}`);
      return;
    }

    if (selectedItemsCount === 0) {
      toast.error('Please select at least one item to wash.');
      return;
    }

    if (!deliveryAddress) {
      toast.error('Delivery address is required.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Laundry Order
      const items = Object.entries(quantities).map(([name, qty]) => ({
        serviceName: name,
        quantity: qty
      }));

      const orderRes = await createOrder.mutateAsync({
        laundryServiceId: id,
        items,
        deliveryAddress,
        pickupType,
        pickupDate: pickupDate ? new Date(pickupDate).toISOString() : undefined,
        notes
      });

      const orderId = orderRes.data._id;
      const amountToPay = orderRes.data.totalAmount;

      // 2. Create Razorpay Payment Order
      const paymentData = await createPayment.mutateAsync({
        userId: user!.id,
        serviceType: 'laundry' as any,
        referenceId: orderId,
        amount: amountToPay,
      });

      // 3. Open Razorpay Modal
      const options = {
        key: paymentData.data.key,
        amount: paymentData.data.amount,
        currency: paymentData.data.currency,
        name: 'Marketplace Platform',
        description: `Laundry Order for ${service.name}`,
        order_id: paymentData.data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success('Your payment was successful and order placed.');
            setIsProcessing(false);
            router.push('/dashboard');
            
          } catch (err) {
            toast.error('Payment Verification Failed. Contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#0f172a' },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.error('Payment process cancelled.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container mx-auto px-4 py-8 max-w-6xl theme-laundry">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{service.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{service.providerAddress}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            <div className="aspect-[21/9] overflow-hidden rounded-2xl bg-muted border">
              <img 
                src={service.images?.[0] || 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80'} 
                alt={service.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">About this service</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {service.description || 'Quality laundry service for your needs.'}
              </p>
            </div>

            <div className="py-6 border-y">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{service.providerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>Contact: {service.providerPhone}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div>
            <Card className="p-6 sticky top-24 border shadow-xl shadow-primary/5">
              <h3 className="text-xl font-bold mb-4">Select Items</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {service.services?.map(s => (
                   <div key={s.name} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                         <p className="font-medium">{s.name}</p>
                         <p className="text-sm text-muted-foreground">₹{s.price} / {s.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
                         <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(s.name, -1)}>
                           <Minus className="h-3 w-3" />
                         </Button>
                         <span className="w-4 text-center text-sm font-medium">{quantities[s.name] || 0}</span>
                         <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => updateQuantity(s.name, 1)}>
                           <Plus className="h-3 w-3" />
                         </Button>
                      </div>
                   </div>
                ))}
              </div>

              <div className="space-y-4 mb-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Delivery Address</Label>
                  <Textarea 
                    placeholder="Enter full delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Pickup Date (Optional)</Label>
                  <Input 
                    type="datetime-local" 
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6 pt-4 border-t">
                {/* Pickup Type Selection */}
                {(service.onsitePickup || service.onStoreService) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Pickup Type</Label>
                    <div className="flex gap-2">
                      {service.onStoreService && (
                        <button
                          type="button"
                          onClick={() => setPickupType('store')}
                          className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                            pickupType === 'store'
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          🏪 Drop at Store
                        </button>
                      )}
                      {service.onsitePickup && (
                        <button
                          type="button"
                          onClick={() => setPickupType('onsite')}
                          className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                            pickupType === 'onsite'
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          🚚 Onsite Pickup
                          {service.onsitePickupCharge > 0 && (
                            <span className="text-xs opacity-70 ml-1">(+₹{service.onsitePickupCharge})</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Items Subtotal</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                {onsiteCharge > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Onsite Pickup Charge</span>
                    <span>+₹{onsiteCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Due</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full text-base font-semibold" 
                onClick={handleBookAndPay}
                disabled={isProcessing || grandTotal <= 0}
              >
                {isProcessing ? 'Processing Payment...' : 'Place Order & Pay'}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure payments with Razorpay</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
