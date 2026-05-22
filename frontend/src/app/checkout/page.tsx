'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Car, Home, MapPin, Clock, CreditCard, CheckCircle, ArrowLeft, Loader2, LocateFixed } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useCreateBooking } from '@/hooks/use-booking';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/use-payment';

declare global { interface Window { Razorpay: any; } }

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const serviceType = searchParams.get('type') || 'vehicle';
  const serviceId = searchParams.get('id') || '';
  const serviceName = searchParams.get('name') || 'Service';

  const createBooking = useCreateBooking();
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  const [serviceData, setServiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingType, setBookingType] = useState<'daily' | 'hourly'>('daily');
  const [bookingLocation, setBookingLocation] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [roomTab, setRoomTab] = useState('single');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/checkout?type=${serviceType}&id=${serviceId}`);
    }
  }, [isAuthenticated]);

  // Fetch service data
  useEffect(() => {
    if (!serviceId) return;
    const endpoint = serviceType === 'house' ? `/api/houses/${serviceId}` : `/api/vehicles/${serviceId}`;
    fetch(endpoint)
      .then(r => r.json())
      .then(json => { setServiceData(json.data || null); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [serviceId, serviceType]);

  // Calculate units
  const [units, setUnits] = useState(1);
  useEffect(() => {
    if (!startDate || !endDate) return;
    const s = new Date(startDate), e = new Date(endDate);
    const diff = Math.abs(e.getTime() - s.getTime());
    if (bookingType === 'hourly') setUnits(Math.max(1, Math.ceil(diff / 3600000)));
    else setUnits(Math.max(1, Math.ceil(diff / 86400000)));
  }, [startDate, endDate, bookingType]);

  // Price calculation
  let unitPrice = 0, basePrice = 0, securityDep = 0, monthlyRent = 0, totalMonths = 0, total = 0, label = '';
  if (serviceData) {
    if (serviceType === 'house') {
      const h = serviceData;
      const propType = h.property_type || h.propertyType;
      if (propType === 'pg') {
        monthlyRent = roomTab === 'double'
          ? (h.double_sharing_price || h.doubleSharingPrice || 0)
          : (h.single_sharing_price || h.singleSharingPrice || h.price_per_month || h.pricePerMonth || 0);
        totalMonths = Math.max(1, Math.ceil(units / 30));
        securityDep = h.security_deposit || h.securityDeposit || 0;
        basePrice = monthlyRent;
        total = monthlyRent + securityDep;
        label = `₹${monthlyRent}/mo × 1 month (upfront) + ₹${securityDep} deposit`;
      } else {
        unitPrice = h.price_per_day || h.pricePerDay || 0;
        basePrice = unitPrice * units;
        total = basePrice;
        label = `₹${unitPrice} × ${units} days`;
      }
    } else {
      unitPrice = bookingType === 'hourly'
        ? (serviceData.price_per_hour || serviceData.pricePerHour || Math.round((serviceData.price_per_day || serviceData.pricePerDay || 0) / 24))
        : (serviceData.price_per_day || serviceData.pricePerDay || 0);
      basePrice = unitPrice * units;
      total = basePrice;
      label = `₹${unitPrice} × ${units} ${bookingType === 'hourly' ? 'hours' : 'days'}`;
    }
  }

  const handleFetchLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported.'); return; }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const d = await r.json();
          const a = d.address;
          setBookingLocation([a.city || a.town || a.village, a.state].filter(Boolean).join(', '));
          toast.success('Location updated!');
        } catch { toast.error('Could not get address.'); }
        setIsFetchingLocation(false);
      },
      () => { setIsFetchingLocation(false); toast.error('Location access denied.'); },
      { timeout: 10000 }
    );
  };

  const handlePay = async () => {
    if (!startDate || !endDate) { toast.error('Select start and end dates.'); return; }
    if (new Date(startDate) >= new Date(endDate)) { toast.error('End must be after start.'); return; }

    const vendorId = typeof serviceData?.vendor_id === 'string' ? serviceData.vendor_id
      : serviceData?.vendor?.id || serviceData?.vendorId;
    if (user?.id === vendorId) { toast.error('Cannot book your own listing.'); return; }

    setIsProcessing(true);
    try {
      const s = new Date(startDate), e = new Date(endDate);
      s.setHours(12,0,0,0); e.setHours(12,0,0,0);

      const bookingRes = await createBooking.mutateAsync({
        userId: user!.id,
        serviceType: serviceType as any,
        serviceId,
        startDate: s.toISOString(),
        endDate: e.toISOString(),
        bookingType,
        notes: bookingLocation ? `Location: ${bookingLocation}` : undefined,
        securityDeposit: securityDep,
        monthlyRent,
        totalMonths,
      } as any);

      const bookingId = bookingRes.data.id || bookingRes.data._id;
      const amt = bookingRes.data.total_amount || bookingRes.data.totalAmount || total;

      const orderRes = await createOrder.mutateAsync({
        userId: user!.id, serviceType: serviceType as any, referenceId: bookingId, amount: amt,
      });

      const opts = {
        key: orderRes.data.key,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: 'UniExo',
        description: `Booking: ${serviceName}`,
        order_id: orderRes.data.razorpayOrderId,
        handler: async (resp: any) => {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setPaymentSuccess(true);
            toast.success('Payment successful! Booking confirmed.');
          } catch { toast.error('Payment verification failed.'); }
          setIsProcessing(false);
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#0f172a' },
        modal: { ondismiss: () => { setIsProcessing(false); toast.error('Payment cancelled.'); } },
      };
      const rzp = new window.Razorpay(opts);
      rzp.on('payment.failed', () => { setIsProcessing(false); toast.error('Payment failed.'); });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Booking failed.');
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <Card className="p-10 text-center max-w-md mx-auto shadow-2xl border-0 rounded-3xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">Your payment was successful. The vendor has been notified.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/dashboard')} className="bg-slate-900 hover:bg-slate-800 rounded-xl px-6">Go to Dashboard</Button>
            <Button variant="outline" onClick={() => router.push(serviceType === 'house' ? '/houses' : '/vehicles')} className="rounded-xl px-6">Browse More</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-sm">
          <h2 className="text-xl font-bold mb-2">Service Not Found</h2>
          <p className="text-muted-foreground mb-4">The listing may have been removed.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const img = serviceData.images?.[0];
  const propType = serviceData.property_type || serviceData.propertyType;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to listing
          </button>

          <h1 className="text-3xl font-bold tracking-tight mb-1">Checkout</h1>
          <p className="text-muted-foreground mb-8">Complete your booking and pay securely</p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* LEFT — Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Service Card */}
              <Card className="p-0 overflow-hidden border-0 shadow-lg rounded-2xl">
                <div className="flex gap-4 p-5">
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {serviceType === 'house' ? <Home className="w-8 h-8 opacity-30" /> : <Car className="w-8 h-8 opacity-30" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {serviceType === 'house' ? (propType === 'pg' ? 'PG' : 'Room') : 'Vehicle'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg truncate">{serviceData.title || serviceData.name || serviceName}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{serviceData.city || serviceData.location || serviceData.address || 'Location TBD'}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Booking Details */}
              <Card className="p-6 border-0 shadow-lg rounded-2xl space-y-5">
                <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Booking Details</h2>

                {serviceType === 'vehicle' && (
                  <div className="space-y-2">
                    <Label>Duration Type</Label>
                    <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={bookingType} onChange={e => setBookingType(e.target.value as any)}>
                      <option value="daily">Per Day</option>
                      <option value="hourly">Per Hour</option>
                    </select>
                  </div>
                )}

                {serviceType === 'house' && propType === 'pg' && (
                  <div className="space-y-2">
                    <Label>Sharing Type</Label>
                    <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={roomTab} onChange={e => setRoomTab(e.target.value)}>
                      <option value="single">Single Sharing</option>
                      <option value="double">Double Sharing</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{serviceType === 'house' ? 'Move-in & Move-out' : 'Dates & Times'}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type={bookingType === 'hourly' ? 'datetime-local' : 'date'} value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().slice(0, bookingType === 'hourly' ? 16 : 10)} className="rounded-xl" />
                    <Input type={bookingType === 'hourly' ? 'datetime-local' : 'date'} value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || new Date().toISOString().slice(0, bookingType === 'hourly' ? 16 : 10)} className="rounded-xl" />
                  </div>
                </div>

                {serviceType === 'vehicle' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <Label>Delivery Location</Label>
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-primary" onClick={handleFetchLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <LocateFixed className="w-3 h-3 mr-1" />} Auto-fill
                      </Button>
                    </div>
                    <Input placeholder="City or address..." value={bookingLocation} onChange={e => setBookingLocation(e.target.value)} className="rounded-xl" />
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:col-span-2">
              <Card className="p-6 border-0 shadow-xl rounded-2xl sticky top-24 bg-white">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-5"><CreditCard className="w-5 h-5 text-primary" /> Payment Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{label || 'Select dates'}</span><span className="font-medium">₹{basePrice.toLocaleString()}</span></div>
                  {securityDep > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Security Deposit</span><span className="font-medium">₹{securityDep.toLocaleString()}</span></div>}
                  <div className="border-t pt-3 flex justify-between text-base font-bold"><span>Total Due Now</span><span className="text-primary">₹{total.toLocaleString()}</span></div>
                </div>

                <Button size="lg" className="w-full mt-6 text-base font-semibold rounded-xl h-12 bg-slate-900 hover:bg-slate-800" onClick={handlePay} disabled={isProcessing || !startDate || !endDate}>
                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : `Pay ₹${total.toLocaleString()}`}
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" /> Secured by Razorpay
                </div>

                {user?.role === 'vendor' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium text-center">
                    Vendors cannot make bookings. Switch to a user account.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
