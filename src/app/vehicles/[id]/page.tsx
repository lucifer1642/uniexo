'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Car, Check, MapPin, Shield, Star, User, LocateFixed, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/auth.store';
import { useVehicle } from '@/hooks/use-vehicle';
import { useCreateBooking } from '@/hooks/use-booking';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/use-payment';
import { ListingApprovalStatus, ServiceType } from '@/types';

// Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuthStore();
  
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const createBooking = useCreateBooking();
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  // Booking state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingType, setBookingType] = useState<'daily' | 'hourly'>('daily');
  const paymentMethod = 'online';
  const [bookingUnits, setBookingUnits] = useState(1);
  const searchParams = useSearchParams();
  const [bookingLocation, setBookingLocation] = useState(searchParams.get('location') || '');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      
      if (bookingType === 'hourly') {
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        setBookingUnits(Math.max(1, diffHours));
      } else {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setBookingUnits(Math.max(1, diffDays));
      }
    }
  }, [startDate, endDate, bookingType]);

  // Set initial active image when vehicle loads
  useEffect(() => {
    if (vehicle?.images?.length) {
      setActiveImage(vehicle.images[0]);
    }
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
        <p className="text-muted-foreground mb-6">The vehicle you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/vehicles')}>Back to Vehicles</Button>
      </div>
    );
  }

  const commissionPercent = 10;
  const unitPrice = bookingType === 'hourly' ? (vehicle.pricePerHour || Math.round(vehicle.pricePerDay / 24)) : vehicle.pricePerDay;
  const basePrice = unitPrice * bookingUnits;
  const serviceFee = (basePrice * commissionPercent) / 100;
  const totalPrice = basePrice; // Total amount user pays 
  
  // Note: Backend calculates totalAmount = vehicle.pricePerDay * days
  // The commission is deducted from vendor's payout, not added to user total (as per booking.service.ts)

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Failed to fetch address');
          
          const data = await response.json();
          const address = data.address;
          
          // Format a clean address string
          const city = address.city || address.town || address.village || address.state_district;
          const state = address.state;
          const country = address.country;
          
          const formattedLocation = [city, state, country].filter(Boolean).join(', ');
          
          if (formattedLocation) {
            setBookingLocation(formattedLocation);
            toast.success('Location updated successfully!');
          } else {
            toast.error('Could not determine city/state from coordinates.');
          }
        } catch (error) {
          console.error(error);
          toast.error('Error fetching address. Please enter manually.');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setIsFetchingLocation(false);
        if (error.code === 1) {
          toast.error('Please allow location access in your browser settings.');
        } else {
          toast.error('Could not get your current location.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleBookNow = () => {
    router.push(`/checkout?type=vehicle&id=${id}&name=${encodeURIComponent(vehicle.name)}`);
  };

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="container mx-auto px-4 py-8 max-w-6xl theme-car">
        {/* Title & Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{vehicle.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Car className="w-4 h-4 text-primary" />
              <span>{vehicle.brand} {vehicle.modelName} ({vehicle.year})</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{typeof vehicle.location === 'string' ? vehicle.location : (vehicle as any).location?.address || 'Location TBD'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-muted border flex items-center justify-center">
                {activeImage ? (
                  <img src={activeImage} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Car className="w-16 h-16 opacity-20 mb-4" />
                    <span>No Image Available</span>
                  </div>
                )}
              </div>
              {vehicle.images && vehicle.images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {vehicle.images.map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImage(img)}
                      className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:opacity-80'
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">About this vehicle</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {vehicle.description || 'No description provided by the vendor.'}
              </p>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-muted-foreground">{vehicle.seatingCapacity} Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-muted-foreground">{vehicle.fuelType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="text-muted-foreground">Plate: {vehicle.registrationNumber}</span>
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="py-6 border-y">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{typeof vehicle.vendorId === 'object' && vehicle.vendorId?.name ? `Hosted by ${vehicle.vendorId.name}` : 'Hosted by Vendor'}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{typeof vehicle.vendorId === 'object' && vehicle.vendorId?.email ? vehicle.vendorId.email : `Vendor ID: ${typeof vehicle.vendorId === 'string' ? vehicle.vendorId.slice(-6) : vehicle.vendorId?._id?.slice(-6) || 'N/A'}`}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Booking Form */}
          <div>
            <Card className="p-6 sticky top-24 border shadow-xl shadow-primary/5">
              <div className="mb-6">
                <span className="text-3xl font-bold">₹{vehicle.pricePerDay.toFixed(2)}</span>
                <span className="text-muted-foreground"> / day</span>
                {vehicle.pricePerHour && (
                  <span className="text-sm ml-2 text-muted-foreground">(₹{vehicle.pricePerHour.toFixed(2)} / hr)</span>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Booking Duration Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value as any)}
                  >
                    <option value="daily">Per Day</option>
                    <option value="hourly">Per Hour</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Dates & Times</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type={bookingType === 'hourly' ? 'datetime-local' : 'date'} 
                      className="bg-background" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().slice(0, bookingType === 'hourly' ? 16 : 10)}
                    />
                    <Input 
                      type={bookingType === 'hourly' ? 'datetime-local' : 'date'} 
                      className="bg-background" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().slice(0, bookingType === 'hourly' ? 16 : 10)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Number of {bookingType === 'hourly' ? 'Hours' : 'Days'}</Label>
                  <Input 
                    type="number" 
                    value={bookingUnits} 
                    readOnly
                    className="bg-muted cursor-not-allowed text-muted-foreground"
                  />
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-end">
                    <Label>Required Location for Delivery/Pickup</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs px-2 text-primary"
                      onClick={handleFetchLocation}
                      disabled={isFetchingLocation}
                    >
                      {isFetchingLocation ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <LocateFixed className="w-3 h-3 mr-1" />}
                      Auto-fill my location
                    </Button>
                  </div>
                  <Input 
                    placeholder="Enter city or specific address..."
                    value={bookingLocation}
                    onChange={(e) => setBookingLocation(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">This location will be sent to the vendor upon booking.</p>
                </div>

                <div className="space-y-2 mb-4">
                  <Label>Payment Method</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Online Payment (Razorpay)
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">₹{unitPrice} x {bookingUnits} {bookingType === 'hourly' ? 'hours' : 'days'}</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-3 border-t text-lg">
                  <span>Total Due Today</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button
                  className="w-full h-12 text-base font-bold bg-[#8B004A] hover:bg-[#8B004A]/90 transition-all rounded-xl"
                  onClick={handleBookNow}
                  disabled={!vehicle.isAvailable || vehicle.approvalStatus !== 'approved'}
                >
                  Book Now
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
