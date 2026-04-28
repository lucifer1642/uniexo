'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Home,
  Car,
  ShoppingBag,
  WashingMachine,
  Play,
  Star,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

import { useRouter } from 'next/navigation';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'house' | 'vehicle' | 'marketplace' | 'laundry'>('house');

  const storefrontFeatures: Record<string, string[]> = {
    house: [
      "Show off your property catalog to everyone & on Google",
      "Automatic update of inventory, photos & Pricing",
      "Accept Video Calls & Schedule Visits from your site",
      'Get Token payment with "Reserve Property" option'
    ],
    vehicle: [
      "List your fleet of cars & bikes online instantly",
      "Real-time availability tracking & status updates",
      "Integrated KYC Verification for safe rentals",
      'One-click "Book Now" with instant token payments'
    ],
    marketplace: [
      "Showcase your second-hand inventory securely",
      'Negotiate prices seamlessly with "Make Offer"',
      "Verified buyer profiles to eliminate spam",
      "Instant payments & arranged local pickups"
    ],
    laundry: [
      "Digital catalog for all your wash & fold services",
      "Allow customers to schedule pickup & drop-off times",
      "Automated order tracking & status updates",
      "Receive online payments per item or bulk weight"
    ]
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column (Text & Actions) */}
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="max-w-xl"
            >
              <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                The easiest way to <br />
                find your <span className="text-[#1faa00]">Needs</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground mb-8">
                Join India's largest Multi-service marketplace.
                <span className="text-[#1faa00] font-medium block mt-1">Save time. Work less. Earn more.</span>
              </motion.p>

              <motion.div variants={fadeUp} className="mb-6">
                <p className="font-medium text-lg mb-4">I am looking for a</p>
                <div className="flex flex-wrap gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => router.push('/vehicles')}
                    className="flex flex-col items-center justify-center p-3 border rounded-xl hover:border-primary hover:shadow-md cursor-pointer transition w-24 h-24 bg-white"
                  >
                    <Car className="w-8 h-8 text-primary mb-2" />
                    <span className="text-xs font-medium">Vehicle</span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => router.push('/houses')}
                    className="flex flex-col items-center justify-center p-3 border rounded-xl hover:border-[#1faa00] hover:shadow-md cursor-pointer transition w-24 h-24 bg-white shadow-sm ring-1 ring-[#1faa00]/20"
                  >
                    <Home className="w-8 h-8 text-[#1faa00] mb-2" />
                    <span className="text-xs font-medium text-[#1faa00]">Room</span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => router.push('/marketplace')}
                    className="flex flex-col items-center justify-center p-3 border rounded-xl hover:border-primary hover:shadow-md cursor-pointer transition w-24 h-24 bg-white"
                  >
                    <ShoppingBag className="w-8 h-8 text-primary mb-2" />
                    <span className="text-xs font-medium">Item</span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    onClick={() => router.push('/laundry')}
                    className="flex flex-col items-center justify-center p-3 border rounded-xl hover:border-primary hover:shadow-md cursor-pointer transition w-24 h-24 bg-white"
                  >
                    <WashingMachine className="w-8 h-8 text-primary mb-2" />
                    <span className="text-xs font-medium">Laundry</span>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 max-w-md mt-8">
                <Input
                  placeholder="Enter location or query"
                  className="h-12 text-base"
                />
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium whitespace-nowrap">
                  Get free demo &rarr;
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column (Hero Graphic) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block h-full min-h-[500px]"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[1.2]">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=800"
                  alt="Professional Service"
                  className="rounded-2xl shadow-2xl object-cover w-[350px] h-[450px]"
                />

                {/* Floating Notification Badge */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-10 -left-12 bg-primary text-white p-4 rounded-xl shadow-xl flex flex-col gap-1 max-w-[200px]"
                >
                  <p className="text-sm font-semibold">100% Secure &</p>
                  <p className="text-sm font-semibold">Verified Vendors. 5 mins max!</p>
                </motion.div>

                {/* Floating Rating Badge */}
                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-16 -right-16 bg-white border p-3 rounded-xl shadow-lg flex items-center gap-3"
                >
                  <div className="flex gap-1 text-[#1faa00]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-[#1faa00] text-[#1faa00]" />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-none">4.9</p>
                    <p className="text-xs text-muted-foreground">675 Reviews</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Strip */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="container mx-auto px-4 md:px-8 mt-16 lg:mt-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y bg-slate-50/50">
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center">
              <Home className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Listings</p>
              <p className="text-2xl font-bold">15,000+</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center border-l border-border/50">
              <Car className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Vehicles</p>
              <p className="text-2xl font-bold">3 Lacs+</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center border-l md:border-l-border/50 border-l-transparent">
              <svg className="w-6 h-6 text-primary mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <p className="text-sm text-muted-foreground mb-1">Users</p>
              <p className="text-2xl font-bold">2.3 Lacs+</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center border-l border-border/50">
              <span className="text-xl font-bold text-primary mb-2">₹</span>
              <p className="text-sm text-muted-foreground mb-1">Value</p>
              <p className="text-2xl font-bold">100 Cr+</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 2. Lead Conversion (Convert leads into booking) */}
      <section className="py-20 bg-slate-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find your perfect match. <span className="font-extrabold text-primary">10X Faster!</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Why wait weeks to find what you need? Get it 10X Faster.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Features List */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-4"
            >
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Browse verified categories in One-click</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Real-time availability & Schedule Visit/Booking</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Connect with verified vendors instantly</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Secure Token Payments with Payment link & QR</p>
              </motion.div>

              <motion.div variants={fadeUp} className="pt-6">
                <Button className="bg-[#1faa00] hover:bg-[#1caa00] text-white h-12 px-8 text-base">
                  Try for free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Mobile Mock UI */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative mx-auto w-full max-w-[320px] isolate"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-[3rem] -z-10 translate-x-4 -translate-y-4"></div>
              <div className="border-[8px] border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden aspect-[1/2] flex flex-col items-center">
                {/* Mock Phone Header */}
                <div className="w-full h-14 bg-slate-50 border-b flex items-center justify-center font-semibold text-primary">
                  Book Item
                </div>
                {/* Mock Content */}
                <div className="p-4 w-full space-y-4 flex-1 mt-2">
                  <div className="h-10 bg-slate-100 rounded border px-3 flex items-center text-sm text-slate-500">John Doe</div>
                  <div className="h-10 bg-slate-100 rounded border px-3 flex items-center text-sm text-slate-500">+91 9876543210</div>
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2 relative">
                    <span className="text-xs font-semibold text-primary">Selected Property</span>
                    <div className="flex justify-between items-center bg-white p-2 rounded text-sm">
                      <span>BMW 5 Series</span>
                      <span className="text-green-600 font-medium">Available</span>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -left-16 top-1/2 bg-slate-800 text-white p-2 text-xs rounded-lg whitespace-nowrap hidden md:block after:content-[''] after:absolute after:top-1/2 after:-right-2 after:-mt-1 after:border-t-4 after:border-t-transparent after:border-b-4 after:border-b-transparent after:border-l-4 after:border-l-slate-800"
                    >
                      Availability Check
                    </motion.div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded border px-3 flex items-center text-sm text-slate-500">25/09/2026 9:00 AM</div>

                  <div className="mt-auto pt-6 w-full space-y-2">
                    <div className="h-10 w-full bg-slate-100 rounded border px-3 flex items-center justify-center text-sm font-medium text-slate-600">Enter Token Amount</div>
                    <div className="h-10 w-full bg-primary rounded flex items-center justify-center text-sm font-medium text-white shadow-sm">Confirm Booking</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Automatic Operations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              100% Secure Transactions. <span className="font-extrabold text-[#1faa00]">5 mins max!</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              No more scams. No more waiting. No more jhikjhik.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Features List */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-4 order-last lg:order-first"
            >
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Automatic receipt & booking confirmation</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Automatic status updates on WhatsApp, SMS & App</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">One-click bulk reminders with Payment Link</p>
              </motion.div>
              <motion.div variants={fadeUp} className="p-4 rounded-xl border border-primary/20 bg-white/50 hover:bg-white shadow-sm transition">
                <p className="font-medium text-primary text-lg">Automatic refund initiation after secure period</p>
              </motion.div>

              <motion.div variants={fadeUp} className="pt-6">
                <Button className="bg-[#1faa00] hover:bg-[#1caa00] text-white h-12 px-8 text-base">
                  Try for free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Mobile Mock UI - List */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative mx-auto w-full max-w-[320px] isolate"
            >
              <div className="absolute inset-0 bg-[#1faa00]/5 rounded-[3rem] -z-10 -translate-x-4 -translate-y-4"></div>
              <div className="border-[8px] border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden aspect-[1/2] flex flex-col">
                <div className="w-full h-14 bg-slate-50 border-b flex items-center px-4 font-semibold text-primary">
                  Select Booking
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50">
                  {[
                    { name: 'John Doe', price: '₹12,000', pending: true, img: 'https://i.pravatar.cc/150?u=1' },
                    { name: 'Sarah Smith', price: '₹5,000', pending: false, img: 'https://i.pravatar.cc/150?u=2' },
                    { name: 'Mike Ross', price: '₹8,500', pending: true, img: 'https://i.pravatar.cc/150?u=3' },
                    { name: 'Jane Austin', price: '₹3,200', pending: false, img: 'https://i.pravatar.cc/150?u=4' },
                    { name: 'Robert Fox', price: '₹15,000', pending: false, img: 'https://i.pravatar.cc/150?u=5' }
                  ].map((user, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-3 rounded-xl border shadow-sm flex items-center justify-between relative"
                    >
                      <div className="flex items-center gap-3">
                        <img src={user.img} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                          <p className="text-sm font-medium leading-none mb-1">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Order: #ORD-{800 + i}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${user.pending ? 'text-orange-500' : 'text-slate-700'}`}>{user.price}</p>
                      </div>
                      {/* Floating Action */}
                      {i === 0 && (
                        <motion.div 
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          className="absolute top-1/2 left-full translate-x-4 -translate-y-1/2 bg-white border p-3 rounded-xl shadow-lg w-48 hidden md:block"
                        >
                          <p className="text-xs font-semibold text-slate-800 mb-2">Send WhatsApp Reminder</p>
                          <div className="h-2 bg-slate-100 rounded-full mb-1"></div>
                          <div className="h-2 bg-slate-100 rounded-full w-2/3 mb-4"></div>
                          <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                            <Play className="w-3 h-3 fill-current" /> Send Now
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="w-full h-10 bg-primary text-white rounded text-sm font-medium flex items-center justify-center shadow-md">
                    Action (2 Selected)
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Dynamic Storefront Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get your Digital Storefront. Market it online & Offline
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              No more repeating the same thing 20 times a day. Less Calls, More conversion.
            </p>

            {/* Tabs */}
            <div className="flex justify-center gap-2 flex-wrap mb-4">
              {[
                { id: 'house', label: 'Houses & Rooms', icon: Home },
                { id: 'vehicle', label: 'Vehicles', icon: Car },
                { id: 'marketplace', label: 'Used Items', icon: ShoppingBag },
                { id: 'laundry', label: 'Laundry', icon: WashingMachine }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-[#1faa00] text-white shadow-md' 
                      : 'bg-white text-slate-600 border hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[550px]">
            {/* Dynamic Mobile Mock UI */}
            <div className="relative mx-auto w-full max-w-[320px] isolate">
              <div className="border-[8px] border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden aspect-[1/2] flex flex-col pt-8 relative">
                
                <AnimatePresence mode="wait">
                  {/* HOUSE MOCK */}
                  {activeTab === 'house' && (
                    <motion.div 
                      key="house" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col pt-8"
                    >
                      <div className="px-4 mb-4">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200">
                          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Storefront" />
                        </div>
                      </div>
                      <div className="px-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg">Premium Suite</h3>
                          <div className="flex items-center text-xs font-bold text-[#1faa00]">
                            <ShieldCheck className="w-3 h-3 text-[#1faa00] mr-1" /> Verified
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">City Center, Downtown</p>

                        <div className="p-3 border rounded-xl shadow-sm mb-4 bg-blue-50/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-primary">₹ 15,000 / Month</span>
                          </div>
                        </div>

                        <p className="text-sm font-semibold mb-2">Amenities</p>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-[#1faa00]" /> Air Cond.</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-[#1faa00]" /> Furniture</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-[#1faa00]" /> Security</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-[#1faa00]" /> Parking</div>
                        </div>

                        <div className="w-full h-12 bg-primary text-white rounded-xl text-sm font-medium flex items-center justify-center shadow-lg">
                          Check Availability
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* VEHICLE MOCK */}
                  {activeTab === 'vehicle' && (
                    <motion.div 
                      key="vehicle" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col pt-8"
                    >
                      <div className="px-4 mb-4">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200">
                          <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Vehicle" />
                        </div>
                      </div>
                      <div className="px-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg">BMW 5 Series</h3>
                          <div className="flex items-center text-xs font-bold text-[#1faa00]">
                            <ShieldCheck className="w-3 h-3 text-[#1faa00] mr-1" /> Verified
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Automatic • Diesel • 5 Seater</p>

                        <div className="p-3 border rounded-xl shadow-sm mb-4 bg-orange-50/50">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-semibold text-orange-600">₹ 3,500 / Day</span>
                          </div>
                        </div>

                        <p className="text-sm font-semibold mb-2">Features</p>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-orange-500" /> Sunroof</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-orange-500" /> Bluetooth</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-orange-500" /> Fastag</div>
                          <div className="flex items-center gap-1 text-xs text-slate-600"><CheckCircle2 className="w-3 h-3 text-orange-500" /> Ext. Warranty</div>
                        </div>

                        <div className="w-full h-12 bg-orange-500 text-white rounded-xl text-sm font-medium flex items-center justify-center shadow-lg">
                          Book Now
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* MARKETPLACE MOCK */}
                  {activeTab === 'marketplace' && (
                    <motion.div 
                      key="marketplace" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col pt-8"
                    >
                      <div className="px-4 mb-4">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 p-4 flex items-center justify-center bg-gray-50">
                          <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80" className="w-full h-full object-cover rounded-lg" alt="Laptop" />
                        </div>
                      </div>
                      <div className="px-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg">Dell XPS 13 (2021)</h3>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border">Used</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Electronics • Laptops</p>

                        <div className="p-3 border rounded-xl shadow-sm mb-4 bg-emerald-50/50">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-emerald-700">₹ 45,000</span>
                            <span className="text-xs line-through text-slate-400">₹ 85,000</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                          Rarely used Dell XPS. 16GB RAM, 512GB SSD. No scratches. Comes with original charger and box.
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div className="w-full h-12 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center justify-center shadow-sm">
                            Make Offer
                          </div>
                          <div className="w-full h-12 bg-emerald-600 text-white rounded-xl text-sm font-medium flex items-center justify-center shadow-lg">
                            Buy Now
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* LAUNDRY MOCK */}
                  {activeTab === 'laundry' && (
                    <motion.div 
                      key="laundry" 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex flex-col pt-8 bg-sky-50/30"
                    >
                      <div className="px-4 mb-4">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-500 shadow-inner">
                           <WashingMachine className="w-20 h-20 text-white opacity-90" />
                        </div>
                      </div>
                      <div className="px-5">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-lg text-slate-800">Premium Wash & Fold</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Includes pickup & delivery</p>

                        <div className="space-y-3 mb-6">
                           <div className="flex justify-between items-center bg-white p-3 border rounded-lg shadow-sm">
                             <span className="text-sm font-medium">Shirts / T-Shirts</span>
                             <div className="flex items-center gap-3">
                               <button className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">-</button>
                               <span className="text-sm font-bold w-4 text-center">5</span>
                               <button className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200">+</button>
                             </div>
                           </div>
                           <div className="flex justify-between items-center bg-white p-3 border rounded-lg shadow-sm">
                             <span className="text-sm font-medium">Pants / Jeans</span>
                             <div className="flex items-center gap-3">
                               <button className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">-</button>
                               <span className="text-sm font-bold w-4 text-center">2</span>
                               <button className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200">+</button>
                             </div>
                           </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-200 pt-4 mb-4">
                           <span className="text-sm text-slate-600">Total (7 items)</span>
                           <span className="font-bold text-lg text-blue-600">₹ 350</span>
                        </div>

                        <div className="w-full h-12 bg-blue-600 text-white rounded-xl text-sm font-medium flex items-center justify-center shadow-lg">
                          Schedule Pickup
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating QR Links */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute right-0 translate-x-1/2 top-40 hidden md:flex flex-col gap-4 z-10"
                >
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="bg-white p-3 border rounded-xl shadow-lg text-center flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1 text-[#1faa00] text-xs font-bold">₹</div>
                    <span className="text-[10px] font-bold text-slate-700">For Payment</span>
                    <span className="text-[10px] font-semibold text-primary mt-1">Generate QR</span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                    className="bg-white p-3 border rounded-xl shadow-lg text-center flex flex-col items-center cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1 text-primary text-xs font-bold">W</div>
                    <span className="text-[10px] font-bold text-slate-700">For Website</span>
                    <span className="text-[10px] font-semibold text-primary mt-1">Generate QR</span>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 relative">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {storefrontFeatures[activeTab].map((feat, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-orange-200 bg-white/50 hover:bg-white shadow-sm transition">
                      <p className="font-medium text-orange-600 text-lg">{feat}</p>
                    </div>
                  ))}

                  <div className="pt-6">
                    <Button className="bg-[#1faa00] hover:bg-[#1caa00] text-white h-12 px-8 text-base">
                      Try for free <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trusted Partners / Testimonial */}
      <section className="py-24 bg-white text-center border-t">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale mb-16"
          >
            <span className="font-bold text-xl">BRAND LOGO</span>
            <span className="font-bold text-xl">BRAND LOGO</span>
            <span className="font-bold text-xl">BRAND LOGO</span>
            <span className="font-bold text-xl">BRAND LOGO</span>
            <span className="font-bold text-xl">BRAND LOGO</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-8"
          >
            Uniexo is the most <span className="text-[#1faa00]">trusted & reliable</span> helper for everyone
          </motion.h2>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            <motion.span variants={fadeUp} className="px-6 py-2 rounded-full border-2 border-orange-400 text-orange-500 font-semibold bg-orange-50">Vehicles</motion.span>
            <motion.span variants={fadeUp} className="px-6 py-2 rounded-full border-2 border-pink-400 text-pink-500 font-semibold bg-pink-50">Houses & Rooms</motion.span>
            <motion.span variants={fadeUp} className="px-6 py-2 rounded-full border-2 border-green-400 text-green-600 font-semibold bg-green-50">Marketplace</motion.span>
            <motion.span variants={fadeUp} className="px-6 py-2 rounded-full border-2 border-purple-400 text-purple-500 font-semibold bg-purple-50">Laundry</motion.span>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center text-left max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 shadow-2xl group cursor-pointer"
            >
              <img src="https://images.unsplash.com/photo-1542314831-c5a4d408ebf3?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500" alt="Testimonial Video" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition">
                  <Play className="w-8 h-8 fill-current ml-2" />
                </div>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-white overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=9" className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Mr. Rahul Sharma</p>
                    <p className="text-white/80 text-sm">Premium Vendor</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-6"
            >
              <motion.p variants={fadeUp} className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed">
                "This is a perfect platform which really gonna help vendors and as well as users because they feel more secure by getting transparent agreements and swift payments with this app."
              </motion.p>
              <motion.div variants={fadeUp}>
                <p className="text-primary font-bold text-lg">Mr. Rahul Sharma</p>
                <p className="text-sm font-medium text-[#1faa00] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-4 h-4 fill-current text-[#1faa00]" /> Using Uniexo since last 25 months
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
