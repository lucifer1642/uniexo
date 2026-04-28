'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  BedDouble, Bath, Square, Check, MapPin, Shield, Star, User, 
  Heart, Share2, Video, Home, Phone, ChevronDown, Headset, Info, Droplet, Car, Flame, Monitor, Zap, Upload, XCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useHouse } from '@/hooks/use-houses';
import { useCreateBooking } from '@/hooks/use-booking';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/use-payment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { api } from '@/lib/api';

// Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function HouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuthStore();
  
  const { data: house, isLoading, error } = useHouse(id);
  const createBooking = useCreateBooking();
  const createOrder = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();

  // Booking state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingMonths, setBookingMonths] = useState(1);
  const paymentMethod = 'online';
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Common');
  const [roomTab, setRoomTab] = useState('Single sharing');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreviewBooking, setIdCardPreviewBooking] = useState<string | null>(null);

  // Set initial active image when house loads
  useEffect(() => {
    if (house?.images?.length) {
      setActiveImage(house.images[0]);
    }
  }, [house]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32 min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !house) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-screen bg-slate-50">
        <h2 className="text-2xl font-bold mb-2">House Not Found</h2>
        <p className="text-muted-foreground mb-6">The property you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/houses')}>Back to Houses</Button>
      </div>
    );
  }

  // Cost calculation
  const monthlyRent = roomTab === 'Single sharing' 
    ? (house.singleSharingPrice || house.pricePerMonth || 0) 
    : (house.doubleSharingPrice || (house.pricePerMonth || 0) * 0.7);

  const securityDep = house.securityDeposit || 0;
  const electricity = (house.propertyType === 'pg' && house.electricityIncluded === false) ? (house.electricityCharge || 0) : 0;
  
  const firstMonthTotal = monthlyRent + securityDep + electricity; 

  const handleBookAndPay = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/houses/${id}`);
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select move-in date.');
      return;
    }

    if (!idCardFile && !user?.idCardPhotoUrl) {
      toast.error('Please upload your ID Card to proceed.');
      return;
    }

    if (user?.id === house.vendorId?.toString()) {
      toast.error('You cannot book your own property.');
      return;
    }

    setIsProcessing(true);

    try {
      let idCardUrl = user?.idCardPhotoUrl;
      if (idCardFile) {
        setIsUploadingId(true);
        const uploadData = new FormData();
        uploadData.append('idCard', idCardFile);
        const uploadRes = await api.post('/users/id-card', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        idCardUrl = uploadRes.data.data.idCardPhotoUrl;
        setIsUploadingId(false);
      }

      // 1. Create Booking
      const bookingData = await createBooking.mutateAsync({
        serviceType: 'house' as any,
        serviceId: id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        paymentMethod,
        totalMonths: bookingMonths,
        idCardUrl,
      } as any);

      const bookingId = bookingData.data._id;
      const amountToPay = bookingData.data.totalAmount; // This should be the firstMonthTotal from backend

      // 2. Create Razorpay Order
      const orderData = await createOrder.mutateAsync({
        serviceType: 'house' as any,
        referenceId: bookingId,
        amount: amountToPay, 
      });

      // 3. Open Razorpay Modal
      const options = {
        key: orderData.data.key,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'Uniexo Marketplace',
        description: `Booking for ${house.title}`,
        order_id: orderData.data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success('Booking confirmed! Payment successful.');
            setIsProcessing(false);
            setIsBookingModalOpen(false);
            router.push('/dashboard');
            
          } catch (verificationError) {
            toast.error('Payment Verification Failed. Contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#2563eb',
        },
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
      toast.error(err.response?.data?.message || 'Something went wrong.');
      setIsProcessing(false);
    }
  };

  const navLinks = ['About', 'Renting Terms', 'Amenities', 'Property Rules', 'Location'];
  const faqs = house.faqs || [];

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-slate-50 min-h-screen pb-24 md:pb-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight uppercase">{house.title}</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white rounded-full">
                <Heart className="w-4 h-4 mr-2" />
                Add to wishlist
              </Button>
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white rounded-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex overflow-x-auto gap-8 pb-4 mb-6 border-b border-gray-200 scrollbar-hide text-sm font-semibold text-gray-600">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="whitespace-nowrap hover:text-black transition-colors cursor-pointer">
                {link}
              </a>
            ))}
          </div>

          {/* Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-10 h-[300px] md:h-[450px] rounded-2xl overflow-hidden">
            <div className="md:col-span-2 h-full relative cursor-pointer group">
              <img 
                src={house.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'} 
                alt={house.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
            <div className="hidden md:grid col-span-2 grid-cols-2 grid-rows-2 gap-2 h-full">
              {house.images?.slice(1, 5).map((img: string, idx: number) => (
                <div key={idx} className="relative cursor-pointer group h-full overflow-hidden">
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Content */}
            <div className="flex-1 space-y-10">
              
              <div id="about" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 border-b border-indigo-100">About Property</div>
                <div className="px-2">
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{house.description || 'A beautiful place to live.'}</p>
                </div>
              </div>

              <div id="renting-terms" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 border-b border-indigo-100">Renting Terms</div>
                <div className="px-2 space-y-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Rent</span>
                    <span className="font-bold text-gray-900">Rs {monthlyRent.toLocaleString()}/- per month</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-bold text-gray-900">₹{securityDep.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div id="amenities" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 border-b border-indigo-100">Amenities</div>
                <div className="px-2">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Common', 'Room', 'Services', 'Food'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {(house as any)[`${activeTab.toLowerCase()}Amenities`]?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="location" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 border-b border-indigo-100">Location</div>
                <div className="px-2 h-80 rounded-xl overflow-hidden border">
                  {house.locationUrl ? (
                    <iframe src={house.locationUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy"></iframe>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Map view unavailable</div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Sticky Sidebar */}
            <div className="hidden lg:block w-[380px] flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
                  <div className="flex flex-col gap-3 mb-6">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 shadow-lg shadow-blue-500/20 font-bold text-lg cursor-pointer" onClick={() => setIsBookingModalOpen(true)}>
                      Reserve Now
                    </Button>
                    <p className="text-xs text-muted-foreground italic">Pay 1st Month Rent + Security Deposit today</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer">
                      <Video className="w-4 h-4 mb-1 text-blue-600" />
                      <span className="text-[10px] font-bold">Video Tour</span>
                    </button>
                    <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer">
                      <MapPin className="w-4 h-4 mb-1 text-green-600" />
                      <span className="text-[10px] font-bold">Visit</span>
                    </button>
                    <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors cursor-pointer">
                      <Phone className="w-4 h-4 mb-1 text-orange-600" />
                      <span className="text-[10px] font-bold">Call</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 py-4 px-5 border-b border-gray-200 font-bold">Available Rooms</div>
                  <div className="flex border-b">
                    {['Single sharing', 'Double sharing'].map(t => (
                      <button 
                        key={t}
                        className={`flex-1 py-3 text-sm font-semibold relative transition-colors cursor-pointer ${roomTab === t ? 'text-blue-600 bg-white' : 'text-gray-500 bg-gray-50'}`}
                        onClick={() => setRoomTab(t)}
                      >
                        {t}
                        {roomTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-right flex-1">
                        <div className="text-sm text-gray-500 font-medium">starts from</div>
                        <div className="font-bold text-green-600 text-lg">Rs {monthlyRent.toLocaleString()} / Bed</div>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer" onClick={() => setIsBookingModalOpen(true)}>
                      Reserve Bed
                    </Button>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Mobile Floating Button */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-lg z-40">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 font-bold text-lg cursor-pointer" onClick={() => setIsBookingModalOpen(true)}>
          Reserve Now
        </Button>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Reserve Bed</DialogTitle>
            <DialogDescription>Pay first month's rent and security deposit to confirm.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
             <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <div>
                   <span className="text-xs font-bold text-blue-600 uppercase">Selected</span>
                   <span className="font-bold text-gray-900 block">{roomTab}</span>
                </div>
                <div className="text-right">
                   <div className="text-lg font-bold text-gray-900">₹{monthlyRent.toLocaleString()}</div>
                   <div className="text-xs text-gray-500">/ month</div>
                </div>
             </div>

             <div className="space-y-3">
              <Label className="font-bold">Tenure (Months) - Max 12</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <button
                    key={m}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center font-bold transition-all cursor-pointer ${bookingMonths === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600'}`}
                    onClick={() => setBookingMonths(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <Label className="text-xs font-bold">Move In</Label>
                 <Input 
                   type="date" 
                   className="bg-gray-50 cursor-pointer" 
                   value={startDate}
                   onChange={(e) => {
                     setStartDate(e.target.value);
                     if (e.target.value) {
                       const start = new Date(e.target.value);
                       const end = new Date(start);
                       end.setMonth(start.getMonth() + bookingMonths);
                       setEndDate(end.toISOString().split('T')[0]);
                     }
                   }}
                   min={new Date().toISOString().split('T')[0]}
                 />
              </div>
              <div className="space-y-1">
                 <Label className="text-xs font-bold">Move Out</Label>
                 <Input type="date" className="bg-gray-50 opacity-70" value={endDate} disabled />
              </div>
            </div>

            {(!user?.idCardPhotoUrl) && (
              <div className="space-y-3 pt-2">
                <Label className="text-rose-600 font-bold flex items-center gap-2">
                   <Shield className="w-4 h-4" /> ID Card Required
                </Label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 p-4 min-h-[100px] flex items-center justify-center">
                  {idCardPreviewBooking ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img src={idCardPreviewBooking} className="w-full h-full object-cover" />
                      <button onClick={() => { setIdCardPreviewBooking(null); setIdCardFile(null); }} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full cursor-pointer">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-[10px] text-gray-500">Click to upload ID photo</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setIdCardFile(e.target.files[0]);
                            setIdCardPreviewBooking(URL.createObjectURL(e.target.files[0]));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200 text-sm">
               <div className="flex justify-between">
                  <span className="text-gray-600">1st Month Rent</span>
                  <span className="font-bold">₹{monthlyRent.toLocaleString()}</span>
               </div>
               <div className="flex justify-between">
                  <span className="text-gray-600">Security Deposit</span>
                  <span className="font-bold">₹{securityDep.toLocaleString()}</span>
               </div>
               {electricity > 0 && (
                 <div className="flex justify-between">
                    <span className="text-gray-600">Electricity Advance</span>
                    <span className="font-bold">₹{electricity.toLocaleString()}</span>
                 </div>
               )}
               <div className="flex justify-between border-t pt-2 mt-2 font-bold text-gray-900">
                  <span>Pay Now</span>
                  <span className="text-blue-600 text-xl">₹{firstMonthTotal.toLocaleString()}</span>
               </div>
               {bookingMonths > 1 && (
                 <div className="text-[10px] text-muted-foreground text-right italic">
                   + ₹{monthlyRent.toLocaleString()}/month for next {bookingMonths - 1} months
                 </div>
               )}
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 cursor-pointer" 
              onClick={handleBookAndPay}
              disabled={isProcessing || isUploadingId}
            >
              {isProcessing || isUploadingId ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </div>
              ) : 'Confirm & Pay'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
