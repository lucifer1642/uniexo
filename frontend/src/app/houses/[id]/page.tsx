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
  Heart, Share2, Video, Home, Phone, ChevronDown, Headset, Info, Droplet, Car, Flame, Monitor, Zap, Upload
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useHouse } from '@/hooks/use-houses';
import { useCreateBooking } from '@/hooks/use-booking';
import { useCreatePaymentOrder, useVerifyPayment } from '@/hooks/use-payment';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [bookingDays, setBookingDays] = useState(30); // Default to a month
  const paymentMethod = 'online';
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [activeImage, setActiveImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Common');
  const [roomTab, setRoomTab] = useState('Single sharing');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Interested Modal State
  const [isInterestedModalOpen, setIsInterestedModalOpen] = useState(false);
  const [interestType, setInterestType] = useState('Visit Property');
  const [selectedVisitDate, setSelectedVisitDate] = useState<string>('');
  const [selectedVisitTime, setSelectedVisitTime] = useState<string>('');
  const [sharingType, setSharingType] = useState<string>('');

  // Calculate days difference and enforce 12-month limit
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Limit to 12 months (approx 366 days)
      if (diffDays > 366) {
        toast.error('Booking limit is maximum 12 months.');
        const maxEnd = new Date(start);
        maxEnd.setMonth(maxEnd.getMonth() + 12);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        return;
      }
      
      setBookingDays(Math.max(1, diffDays));
    }
  }, [startDate, endDate]);

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
  let basePrice = 0;
  let upfrontRent = 0;
  let totalMonths = 1;
  let rentPerMonth = 0;
  
  if (house?.propertyType === 'pg') {
    rentPerMonth = house.pricePerMonth || 0;
    if (roomTab === 'Single sharing') rentPerMonth = house.singleSharingPrice || rentPerMonth;
    else if (roomTab === 'Double sharing') rentPerMonth = house.doubleSharingPrice || (rentPerMonth * 0.7);
    
    totalMonths = Math.max(1, Math.ceil(bookingDays / 30));
    basePrice = rentPerMonth * totalMonths;
    upfrontRent = rentPerMonth; // Only pay 1st month upfront
  } else {
    const ratePerDay = house?.pricePerDay || 0;
    basePrice = ratePerDay * bookingDays;
    upfrontRent = basePrice;
  }
  
  const securityDep = house?.propertyType === 'pg' ? (house.securityDeposit || 0) : 0;
  const electricity = (house?.propertyType === 'pg' && house.electricityIncluded === false) ? (house.electricityCharge || 0) : 0;
  
  const upfrontTotal = upfrontRent + securityDep + electricity;
  const totalPrice = basePrice + securityDep + electricity; 

  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  const handleBookAndPay = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/houses/${id}`);
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date.');
      return;
    }

    if (!idCardFile) {
      toast.error('Please upload your ID Card for verification.');
      return;
    }

    if (user?.id === house.vendorId?.toString()) {
      toast.error('You cannot book your own property.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Upload ID Card
      const formData = new FormData();
      formData.append('document', idCardFile);
      formData.append('type', 'id_card');
      const uploadRes = await api.post('/users/kyc-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const idCardUrl = uploadRes.data.data.url;

      // 2. Create Booking
      const startD = new Date(startDate);
      const endD = new Date(endDate);
      startD.setHours(12, 0, 0, 0);
      endD.setHours(12, 0, 0, 0);

      const bookingData = await createBooking.mutateAsync({
        serviceType: 'house' as any,
        serviceId: id,
        startDate: startD.toISOString(),
        endDate: endD.toISOString(),
        paymentMethod,
        idCardUrl,
        securityDeposit: securityDep,
        monthlyRent: rentPerMonth,
        totalMonths: totalMonths,
        totalAmount: upfrontTotal, // Pay only 1st month + deposit upfront
      } as any);

      const bookingId = bookingData.data._id;
      const amountToPay = bookingData.data.totalAmount;

      // 3. Create Razorpay Order
      const orderData = await createOrder.mutateAsync({
        serviceType: 'house' as any,
        referenceId: bookingId,
        amount: amountToPay, 
      });

      // 4. Open Razorpay Modal
      const options = {
        key: orderData.data.key,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'Marketplace Platform',
        description: `Upfront Payment for ${house.title}`,
        order_id: orderData.data.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            toast.success('Your booking is confirmed! Upfront amount paid.');
            setIsProcessing(false);
            setIsBookingModalOpen(false);
            router.push('/dashboard');
            
          } catch (verificationError) {
            toast.error('Payment Verification Failed. Please contact support.');
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
  
  const faqs = house.faqs && house.faqs.length > 0 ? house.faqs : [];

  // Generate next 7 days for the interest modal
  const next7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const visitTimes = [
    '9 - 9:30 AM', '9:30 - 10 AM', '10 - 10:30 AM', '10:30 - 11 AM', '11 - 11:30 AM',
    '11:30 - 12 PM', '12 - 12:30 PM', '12:30 - 1 PM', '1 - 1:30 PM', '1:30 - 2 PM',
    '2 - 2:30 PM', '2:30 - 3 PM', '3 - 3:30 PM', '3:30 - 4 PM', '4 - 4:30 PM',
    '4:30 - 5 PM', '5 - 5:30 PM', '5:30 - 6 PM'
  ];

  const handleInterestSubmit = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/houses/${id}`);
      return;
    }
    toast.success(`Your interest for ${interestType} has been registered!`);
    setIsInterestedModalOpen(false);
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-slate-50 min-h-screen pb-24 md:pb-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight uppercase">{house.title}</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-white shadow-sm font-medium h-10 px-4 rounded-full">
                <Heart className="w-4 h-4 mr-2" />
                Add to wishlist
              </Button>
              <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-white shadow-sm font-medium h-10 px-4 rounded-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share this
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex overflow-x-auto gap-8 pb-4 mb-6 border-b border-gray-200 scrollbar-hide text-sm font-semibold text-gray-600">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="whitespace-nowrap hover:text-black transition-colors cursor-pointer">
                {link}
              </a>
            ))}
          </div>

          {/* Image Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-10 h-[300px] md:h-[450px] rounded-2xl overflow-hidden">
            <div className="md:col-span-2 h-full relative cursor-pointer group">
              <img 
                src={house.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'} 
                alt={house.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            </div>
            {house.images && house.images.length > 1 ? (
              <div className="hidden md:grid col-span-2 grid-cols-2 grid-rows-2 gap-2 h-full">
                {house.images.slice(1, 5).map((img: string, idx: number) => (
                  <div key={idx} className="relative cursor-pointer group h-full overflow-hidden">
                    <img 
                      src={img} 
                      alt={`Gallery ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    {idx === 3 && house.images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium text-lg">
                        +{house.images.length - 5} photos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
                <div className="hidden md:grid col-span-2 grid-cols-2 grid-rows-2 gap-2 h-full">
                    {[1, 2, 3, 4].map((_, idx) => (
                        <div key={idx} className="bg-gray-200 h-full flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Content Column */}
            <div className="flex-1 space-y-10">
              
              {/* About Property */}
              <div id="about" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                  About Property
                </div>
                <div className="px-2">
                  <h3 className="text-gray-900 font-medium mb-3">{house.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    {house.description || 'A beautiful place to live.'}
                  </p>
                  <button className="text-blue-600 font-medium text-sm underline underline-offset-4 hover:text-blue-800 transition-colors">
                    View more
                  </button>
                </div>
              </div>

              {/* Renting Terms */}
              <div id="renting-terms" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                  Renting Terms
                </div>
                <div className="px-2 space-y-5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">💵</div>
                      <span>Rent</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-right">Rs {house.propertyType === 'pg' ? house.pricePerMonth?.toLocaleString() : house.pricePerDay?.toLocaleString()}/- {house.propertyType === 'pg' ? 'per month' : 'per day'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">🛡️</div>
                      <span>Security Deposit</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-right">
                      {securityDep > 0 ? `₹${securityDep.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">🔒</div>
                      <span>Lockin Period</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-right">{house.lockinPeriod || '0 months'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">⏰</div>
                      <span>Notice Period</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-right">{house.noticePeriod || '15 days'}</span>
                  </div>
                </div>
              </div>

              {/* Property Amenities */}
              <div id="amenities" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                  Property Amenities
                </div>
                <div className="px-2">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['Common', 'Room', 'Services', 'Food'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-full border text-sm font-medium transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    {activeTab === 'Common' && (house.commonAmenities?.length > 0 ? (
                      house.commonAmenities.map((item: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 text-gray-700">
                           <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                             <Check className="w-3.5 h-3.5" strokeWidth={3} />
                           </div>
                           <span className="font-medium text-gray-700">{item}</span>
                         </div>
                      ))
                    ) : (
                      <span className="text-gray-500 italic col-span-2">No common amenities listed.</span>
                    ))}

                    {activeTab === 'Room' && (house.roomAmenities?.length > 0 ? (
                      house.roomAmenities.map((item: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 text-gray-700">
                           <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                             <Check className="w-3.5 h-3.5" strokeWidth={3} />
                           </div>
                           <span className="font-medium text-gray-700">{item}</span>
                         </div>
                      ))
                    ) : (
                       <span className="text-gray-500 italic col-span-2">No room amenities listed.</span>
                    ))}

                    {activeTab === 'Services' && (house.servicesAmenities?.length > 0 ? (
                      house.servicesAmenities.map((item: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 text-gray-700">
                           <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                             <Check className="w-3.5 h-3.5" strokeWidth={3} />
                           </div>
                           <span className="font-medium text-gray-700">{item}</span>
                         </div>
                      ))
                    ) : (
                       <span className="text-gray-500 italic col-span-2">No services listed.</span>
                    ))}

                    {activeTab === 'Food' && (house.foodAmenities?.length > 0 ? (
                      house.foodAmenities.map((item: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 text-gray-700">
                           <div className="p-1.5 rounded-md bg-green-50 text-green-600">
                             <Check className="w-3.5 h-3.5" strokeWidth={3} />
                           </div>
                           <span className="font-medium text-gray-700">{item}</span>
                         </div>
                      ))
                    ) : (
                       <span className="text-gray-500 italic col-span-2">No food amenities listed.</span>
                    ))}
                  </div>
                  
                  <button className="text-blue-600 font-medium text-sm mt-6 flex items-center underline underline-offset-4 hover:text-blue-800 transition-colors">
                    View all amenities <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Property Rules */}
              <div id="property-rules" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                  Property Rules
                </div>
                <div className="px-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Check className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{house.title} near {house.address} region</span>
                  </div>
                  <button className="text-blue-600 font-medium text-sm flex items-center underline underline-offset-4 hover:text-blue-800 transition-colors">
                    View other rules <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>

               {/* Location Placeholder */}
               <div id="location" className="scroll-mt-6">
                <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                  Search by location
                </div>
                <div className="px-2">
                  <div className="bg-gray-200 w-full h-80 rounded-xl relative overflow-hidden border border-gray-300 shadow-sm flex items-center justify-center group">
                      {house.locationUrl ? (
                         <iframe 
                           src={house.locationUrl} 
                           width="100%" 
                           height="100%" 
                           style={{ border: 0 }} 
                           allowFullScreen={false} 
                           loading="lazy" 
                           referrerPolicy="no-referrer-when-downgrade"
                           className="z-0"
                         ></iframe>
                      ) : (
                         <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=New+Delhi,India&zoom=14&size=800x400&sensor=false')] bg-cover bg-center"></div>
                      )}
                      
                      {!house.locationUrl && (
                        <>
                          <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
                            <MapPin className="text-red-500 w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-600 text-left truncate w-full">Location hidden or not provided</span>
                          </div>
                          <div className="relative z-10 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
                            <MapPin className="w-6 h-6" />
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Customer Support Banner */}
              <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-6 flex items-center justify-between border border-rose-100 mt-12 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                <div className="relative z-10 max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Customer Support</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Still confused? Our customer support executive will help you with anything.
                  </p>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 relative z-10 flex-shrink-0">
                  <Headset className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="mb-10">
                  <div className="bg-indigo-50/50 py-3 px-4 rounded-t-xl mb-4 font-semibold text-gray-800 tracking-wide border-b border-indigo-100">
                    FAQs
                  </div>
                  <div className="space-y-0 px-2 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    {faqs.map((faq: any, idx: number) => (
                      <div key={idx} className="border-b border-gray-200 last:border-0">
                        <button 
                          className="w-full text-left py-4 px-5 font-medium text-sm text-gray-800 flex justify-between items-center hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        >
                          {faq.question}
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === idx && (
                          <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed bg-gray-50">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Sticky Sidebar (Desktop only) */}
            <div className="hidden lg:block w-[380px] flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                
                {/* Actions Card - Hidden for Owner */}
                {user?.id !== house.vendorId?.toString() && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 pb-6 text-center">
                    <div className="flex gap-3 mb-8">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-11 shadow-md shadow-blue-500/20 font-semibold" onClick={() => setIsInterestedModalOpen(true)}>
                        I'm interested
                      </Button>
                      <Button variant="outline" className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 bg-white rounded-full h-11 font-semibold" onClick={() => setIsBookingModalOpen(true)}>
                        Reserve Bed
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-orange-500">👉</span>
                      <span className="text-gray-500 text-sm font-medium">Real time or Reel time; you choose</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 rounded-xl transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-blue-600">
                          <Video className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Live video tour</span>
                      </button>
                      <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 rounded-xl transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-green-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Visit Property</span>
                      </button>
                      <button className="flex flex-col items-center justify-center py-4 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 border border-gray-200 rounded-xl transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-orange-600">
                          <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Phone Call</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Available Rooms Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 py-4 px-5 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       Available Rooms
                    </h3>
                  </div>
                  
                  <div className="flex border-b border-gray-200">
                    <button 
                      className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${roomTab === 'Single sharing' ? 'text-blue-600 bg-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => setRoomTab('Single sharing')}
                    >
                      Single sharing
                      {roomTab === 'Single sharing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                    </button>
                    <button 
                      className={`flex-1 py-3 text-sm font-semibold text-center border-l transition-colors relative ${roomTab === 'Double sharing' ? 'text-blue-600 bg-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => setRoomTab('Double sharing')}
                    >
                      Double sharing
                      {roomTab === 'Double sharing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                            <BedDouble className="w-5 h-5 text-blue-600" />
                         </div>
                         <h4 className="font-bold text-gray-900 text-lg">{roomTab}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 font-medium">starts from</div>
                        <div className="font-bold text-green-600 text-lg">Rs {roomTab === 'Single sharing' ? house.singleSharingPrice || house.pricePerMonth || 9000 : house.doubleSharingPrice || (house.pricePerMonth || 9000) * 0.7} / Bed</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-sm font-bold text-gray-900 mb-4 bg-gray-50 py-1.5 px-3 rounded-md inline-block">Room Amenities</div>
                      {house.roomAmenities && house.roomAmenities.length > 0 ? (
                        <div className="grid grid-cols-2 gap-y-4 text-sm text-gray-700">
                          {house.roomAmenities.slice(0, 6).map((amenity: string, i: number) => (
                            <div key={i} className="flex items-center gap-2"><span className="text-green-500">✓</span> {amenity}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No amenities listed</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                      <div className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                        {house.tenantsStaying || 0} Tenants staying
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-semibold shadow-md shadow-blue-500/20" onClick={() => setIsBookingModalOpen(true)}>
                        Reserve Now
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile Only) - Hidden for Owner */}
      {user?.id !== house.vendorId?.toString() && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40">
          <div className="flex gap-3 max-w-sm mx-auto">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 shadow-lg shadow-blue-500/30 text-base font-semibold" onClick={() => setIsInterestedModalOpen(true)}>
              I'm interested
            </Button>
            <Button variant="outline" className="flex-1 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg h-12 text-base font-semibold" onClick={() => setIsBookingModalOpen(true)}>
              Reserve bed
            </Button>
          </div>
        </div>
      )}

       {/* Chat Bubble Widget */}
       <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50 flex items-center justify-end">
            <div className="bg-blue-600 text-white px-5 py-3 rounded-full shadow-xl shadow-blue-500/40 flex items-center gap-2 font-semibold cursor-pointer hover:bg-blue-700 transition-colors mr-2">
                <Headset className="w-5 h-5" />
                Tell me more!
            </div>
        </div>

      {/* Interest/Visit Modal */}
      <Dialog open={isInterestedModalOpen} onOpenChange={setIsInterestedModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] p-6 overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="sr-only">I'm interested</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2 w-full min-w-0">
            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
              {['Video tour', 'Visit Property', 'Phone Call'].map((type) => (
                <button
                  key={type}
                  className={`flex-1 py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${interestType === type ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setInterestType(type)}
                >
                  {type === 'Video tour' && <Video className="w-5 h-5" />}
                  {type === 'Visit Property' && <MapPin className="w-5 h-5" />}
                  {type === 'Phone Call' && <Phone className="w-5 h-5" />}
                  <span className="text-xs">{type}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900">Select Date</Label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {next7Days.map((date, idx) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    return (
                      <button
                        key={idx}
                        className={`flex-shrink-0 w-[4.5rem] py-3 flex flex-col items-center justify-center rounded-xl border snap-start transition-all ${selectedVisitDate === dateStr ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                        onClick={() => setSelectedVisitDate(dateStr)}
                      >
                        <span className="text-xs font-medium mb-1">{dayName}</span>
                        <span className="text-lg font-bold">{dayNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900">Select Time</Label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {visitTimes.map((time, idx) => (
                    <button
                      key={idx}
                      className={`flex-shrink-0 px-5 py-2.5 rounded-full border text-sm font-medium snap-start transition-all ${selectedVisitTime === time ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setSelectedVisitTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-900">Do you wish to choose sharing type?</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
                  value={sharingType}
                  onChange={(e) => setSharingType(e.target.value)}
                >
                  <option value="">Choose sharing type (optional)</option>
                  <option value="Single sharing">Single sharing</option>
                  <option value="Double sharing">Double sharing</option>
                  <option value="Triple sharing">Triple sharing</option>
                </select>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full text-base font-semibold h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30"
              onClick={handleInterestSubmit}
              disabled={!selectedVisitDate || !selectedVisitTime}
            >
              {isAuthenticated ? 'Submit Request' : 'Sign up to continue'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal integrated with existing payment flow */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] p-6 overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Reserve Bed in {house.title}</DialogTitle>
            <DialogDescription>
              Select your dates and payment method to finalize the reservation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 w-full min-w-0">
             <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center mb-4">
                <div>
                   <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">Selected Room</span>
                   <span className="font-bold text-gray-900">{roomTab === 'Double sharing' ? 'Double Sharing Bed' : 'Single Sharing Bed'}</span>
                </div>
                <div className="text-right">
                   <div className="text-xl font-bold text-gray-900">₹{house.propertyType === 'pg' ? (roomTab === 'Single sharing' ? house.singleSharingPrice || house.pricePerMonth || 9000 : house.doubleSharingPrice || (house.pricePerMonth || 9000) * 0.7) : house.pricePerDay || 500}</div>
                   <div className="text-xs text-gray-500 font-medium">/ {house.propertyType === 'pg' ? 'month' : 'day'}</div>
                </div>
             </div>

            <div className="space-y-2">
              <Label>Dates</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <span className="text-xs text-gray-500 font-medium ml-1">Move In</span>
                   <Input 
                     type="date" 
                     className="bg-gray-50 border-gray-200" 
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     min={new Date().toISOString().split('T')[0]}
                   />
                </div>
                <div className="space-y-1">
                   <span className="text-xs text-gray-500 font-medium ml-1">Move Out</span>
                   <Input 
                     type="date" 
                     className="bg-gray-50 border-gray-200" 
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                     min={startDate || new Date().toISOString().split('T')[0]}
                   />
                </div>
              </div>
            </div>
            
             <div className="space-y-2">
               <Label>Verify Identity</Label>
               <div className="relative group">
                 <Input 
                   type="file" 
                   accept="image/*,application/pdf"
                   className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
                   onChange={(e) => {
                     if (e.target.files && e.target.files[0]) {
                       setIdCardFile(e.target.files[0]);
                     }
                   }}
                 />
                 <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-muted-foreground transition-all ${idCardFile ? 'border-emerald-500 bg-emerald-50' : 'group-hover:border-primary/50 group-hover:bg-primary/5'}`}>
                   {idCardFile ? (
                     <>
                        <Check className="w-6 h-6 text-emerald-500 mb-1" />
                        <p className="text-xs font-bold text-emerald-700">{idCardFile.name}</p>
                     </>
                   ) : (
                     <>
                        <Upload className="w-6 h-6 mb-1 opacity-50" />
                        <p className="text-xs font-medium">Upload ID Card (Aadhar/PAN)</p>
                     </>
                   )}
                 </div>
               </div>
             </div>

             <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                 <div className="flex justify-between text-gray-600">
                   <span>Duration</span>
                   <span className="font-medium text-gray-900">{house.propertyType === 'pg' ? `${totalMonths} month(s)` : `${bookingDays} days`}</span>
                 </div>
                 {house.propertyType === 'pg' && securityDep > 0 && (
                      <div className="flex justify-between text-gray-600">
                         <span>Security Deposit</span>
                         <span className="font-medium text-gray-900">₹{securityDep.toLocaleString()}</span>
                      </div>
                  )}
                 <div className="flex justify-between text-gray-600">
                   <span>{house.propertyType === 'pg' ? '1st Month Rent' : 'Total Rent'}</span>
                   <span className="font-medium text-gray-900">₹{upfrontRent.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between font-bold pt-3 mt-1 border-t border-gray-200 text-lg">
                   <span className="text-gray-900">Upfront Payment</span>
                   <span className="text-blue-600">₹{upfrontTotal.toLocaleString()}</span>
                 </div>
                 {house.propertyType === 'pg' && totalMonths > 1 && (
                   <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
                     * Subsequent months (₹{rentPerMonth}/mo) will be charged monthly.
                   </p>
                 )}
             </div>
            
          </div>

          <div className="pt-2">
              <Button 
                size="lg" 
                className="w-full text-base font-semibold h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30" 
                onClick={handleBookAndPay}
                disabled={isProcessing || !house.isAvailable || house.approvalStatus !== 'approved'}
              >
                {isProcessing ? 'Processing Payment...' : 
                 !house.isAvailable ? 'Unavailable for Dates' : 
                 house.approvalStatus !== 'approved' ? 'Listing Pending Approval' :
                 'Confirm & Pay Now'}
              </Button>
               <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure payments powered by Razorpay</span>
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
