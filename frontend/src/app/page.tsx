'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import {
  Home as HomeIcon,
  Car,
  ShoppingBag,
  WashingMachine,
  Star,
  ShieldCheck,
  Zap,
  MapPin,
  Upload,
  CheckCircle2,
  Play,
  ArrowRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { Dashboard } from '@/components/dashboard';
import { useRouter } from 'next/navigation';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const wordReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as any }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Counter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(totalMiliseconds / end, 1);

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / 16)); // ~60fps
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

function Landing() {
  const [activeTab, setActiveTab] = useState<'house' | 'vehicle' | 'marketplace' | 'laundry'>('house');
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const badgeY1 = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const badgeY2 = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

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
    <div className="flex flex-col min-h-screen overflow-hidden mesh-gradient relative">
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />

      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column (Text & Actions) */}
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="max-w-2xl"
              style={{ y: heroY }}
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                <Zap className="w-3 h-3 fill-current" />
                <span>INDIA'S LARGEST MULTI-SERVICE HUB</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                {"The easiest way to find your Needs".split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    className="inline-block mr-[0.2em]"
                  >
                    {word === "Needs" ? <span className="text-accent underline decoration-accent/30 underline-offset-8">Needs</span> : word}
                  </motion.span>
                ))}
              </h1>

              <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                Join the revolution. <span className="text-foreground font-semibold">Save time. Work less. Earn more.</span> 
                Verified listings for everyone, everywhere.
              </motion.p>

              <motion.div variants={fadeUp} className="mb-8">
                <div className="flex flex-wrap gap-4">
                  {[
                    { icon: Car, label: 'Vehicle', color: 'primary' },
                    { icon: HomeIcon, label: 'Room', color: 'primary' },
                    { icon: ShoppingBag, label: 'Item', color: 'primary' },
                    { icon: WashingMachine, label: 'Laundry', color: 'primary' }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`glass p-4 rounded-2xl flex flex-col items-center justify-center w-28 h-28 cursor-pointer transition-all hover:border-primary/50 group ${item.label === 'Room' ? 'ring-2 ring-accent shadow-accent/10' : ''}`}
                    >
                      <item.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 max-w-md">
                <div className="relative flex-1 group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Enter location or query"
                    className="h-12 pl-12 text-base rounded-2xl border-2 focus-visible:ring-primary/20 bg-white/50 backdrop-blur-sm"
                  />
                </div>
                <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                  Explore Now
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column (Hero Graphic) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block h-full min-h-[600px]"
            >
              <motion.div 
                style={{ y: heroY }}
                className="relative z-20"
              >
                <div className="relative group perspective-[1000px]">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800&h=1000"
                    alt="Professional Service"
                    className="rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] object-cover w-[400px] h-[550px] mx-auto transition-transform duration-500 group-hover:rotate-y-6"
                  />
                  <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
                </div>

                {/* Floating Notification Badge */}
                <motion.div 
                  style={{ y: badgeY1 }}
                  className="glass absolute top-12 -left-16 p-5 rounded-3xl shadow-2xl flex flex-col gap-2 max-w-[220px] animate-float z-30"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold">100% Verified</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">Top-rated vendors approved in under 5 minutes.</p>
                </motion.div>

                {/* Floating Rating Badge */}
                <motion.div 
                  style={{ y: badgeY2 }}
                  className="glass absolute bottom-20 -right-20 p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-float z-30"
                >
                  <div className="flex flex-col">
                    <div className="flex gap-1 text-accent mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Avg Rating 4.9/5</p>
                  </div>
                  <div className="w-[2px] h-8 bg-border" />
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <Avatar key={i} className="w-8 h-8 border-2 border-white">
                        <AvatarImage src={`https://i.pravatar.cc/100?u=${i + 10}`} />
                      </Avatar>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="container mx-auto px-4 md:px-8 mt-16 lg:mt-24 relative z-20"
        >
          <div className="glass rounded-[3rem] p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-12 border-white/40 shadow-2xl">
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform">
                <HomeIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Properties</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900"><Counter value={15000} />+</h3>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-inner">
                <Car className="w-8 h-8 text-accent" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Vehicles</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900"><Counter value={300} />K+</h3>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center mb-6 shadow-inner">
                <Star className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Reviews</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900"><Counter value={45} />K+</h3>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center mb-6 shadow-inner">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Users</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900"><Counter value={250} />K+</h3>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 2. Lead Conversion */}
      <section className="py-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
              Find your perfect match. <br />
              <span className="text-primary italic">10X Faster than before.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Why wait weeks to find what you need? Uniexo automates the search, 
              verification, and booking process so you can focus on what matters.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Features List */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-6"
            >
              {[
                { title: "Smart Category Filters", desc: "Browse verified categories with AI-powered matching." },
                { title: "Real-time Availability", desc: "Instant status updates for every single listing." },
                { title: "Direct Vendor Connection", desc: "Connect with verified owners via secure channels." },
                { title: "Secure Token Payments", desc: "Reserve your items with instant QR-based payments." }
              ].map((feat, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeUp} 
                  whileHover={{ x: 10 }}
                  className="group p-6 rounded-3xl border border-white/40 glass hover:bg-white/60 transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1 text-slate-900">{feat.title}</h4>
                      <p className="text-muted-foreground">{feat.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} className="pt-6">
                <Button className="bg-accent hover:bg-accent/90 text-white h-12 px-8 text-base rounded-2xl font-bold shadow-lg shadow-accent/20">
                  Start Your Search <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Mobile Mock UI with Parallax */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }} 
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full max-w-[360px]"
            >
              <div className="absolute inset-0 bg-primary/10 rounded-[4rem] blur-3xl -z-10 translate-x-10 translate-y-10" />
              <div className="border-[12px] border-slate-900 rounded-[3.5rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden aspect-[9/19] flex flex-col items-center relative">
                {/* Mock Phone Header */}
                <div className="w-full h-14 bg-slate-50 border-b flex items-center justify-center font-semibold text-primary">
                  Book Item
                </div>
                {/* Mock Content */}
                <div className="p-6 w-full space-y-6 flex-1 mt-4">
                  <div className="h-12 bg-slate-100 rounded-2xl border px-4 flex items-center text-sm font-medium text-slate-700">John Doe</div>
                  <div className="h-12 bg-slate-100 rounded-2xl border px-4 flex items-center text-sm font-medium text-slate-700">+91 9876543210</div>
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 relative">
                    <span className="text-xs font-bold text-primary uppercase tracking-tighter">Selected Property</span>
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm text-sm">
                      <span className="font-bold">BMW 5 Series</span>
                      <span className="text-accent font-black">Available</span>
                    </div>
                  </div>
                  <div className="h-12 bg-slate-100 rounded-2xl border px-4 flex items-center text-sm font-medium text-slate-700">25/09/2026 9:00 AM</div>

                  <div className="mt-auto pt-10 w-full space-y-3">
                    <div className="h-12 w-full bg-slate-100 rounded-2xl border px-4 flex items-center justify-center text-sm font-bold text-slate-600">Enter Token Amount</div>
                    <div className="h-12 w-full bg-primary rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary/30">Confirm Booking</div>
                  </div>
                </div>
              </div>

              {/* Floating Parallax Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -right-16 top-1/3 glass p-4 rounded-2xl shadow-xl z-20 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold whitespace-nowrap">Instant Approval</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Automatic Operations */}
      <section className="py-24 relative bg-slate-900 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tight">
              100% Secure. <br />
              <span className="text-accent italic">Zero friction operations.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Automate the boring stuff. From receipts to reminders, 
              Uniexo handles everything so you don't have to.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Features List */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
              className="space-y-6 order-last lg:order-first"
            >
              {[
                { title: "Smart Invoicing", desc: "Automatic receipt & booking confirmation sent instantly." },
                { title: "Multi-channel Alerts", desc: "Status updates via WhatsApp, SMS, and App notifications." },
                { title: "One-click Reminders", desc: "Bulk payment links sent to users with one tap." },
                { title: "Escrow Protection", desc: "Secure holding of funds until service delivery." }
              ].map((feat, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeUp} 
                  whileHover={{ x: -10 }}
                  className="group p-6 rounded-3xl border border-white/5 glass-dark hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-bold text-xl group-hover:bg-accent group-hover:text-white transition-colors">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1 text-white">{feat.title}</h4>
                      <p className="text-slate-400">{feat.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} className="pt-6 text-center lg:text-left">
                <Button className="bg-primary hover:bg-primary/90 text-white h-12 px-8 text-base rounded-2xl font-bold shadow-lg shadow-primary/20">
                  Join as Vendor <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Mobile Mock UI - List */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 20 }} 
              whileInView={{ opacity: 1, scale: 1, x: 0 }} 
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto w-full max-w-[360px]"
            >
              <div className="absolute inset-0 bg-accent/10 rounded-[4rem] blur-3xl -z-10 -translate-x-10 translate-y-10" />
              <div className="border-[12px] border-slate-800 rounded-[3.5rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden aspect-[9/19] flex flex-col">
                <div className="w-full h-16 bg-slate-50 border-b flex items-center px-6 font-bold text-slate-900">
                  Manage Bookings
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {[
                    { name: 'John Doe', price: '₹12,000', pending: true, img: 'https://i.pravatar.cc/150?u=1' },
                    { name: 'Sarah Smith', price: '₹5,000', pending: false, img: 'https://i.pravatar.cc/150?u=2' },
                    { name: 'Mike Ross', price: '₹8,500', pending: true, img: 'https://i.pravatar.cc/150?u=3' },
                    { name: 'Jane Austin', price: '₹3,200', pending: false, img: 'https://i.pravatar.cc/150?u=4' }
                  ].map((user, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between relative"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.img} />
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">ORD-{800 + i}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${user.pending ? 'text-orange-500' : 'text-slate-900'}`}>{user.price}</p>
                      </div>
                      
                      {i === 0 && (
                        <motion.div 
                          animate={{ x: [0, 10, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                          className="absolute -right-24 top-1/2 -translate-y-1/2 glass p-4 rounded-2xl shadow-2xl w-48 hidden md:block z-20"
                        >
                          <div className="flex items-center gap-2 mb-2 text-primary">
                            <Zap className="w-4 h-4 fill-current" />
                            <span className="text-[10px] font-black uppercase">Quick Remind</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full w-full mb-1" />
                          <div className="h-2 bg-slate-100 rounded-full w-2/3" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="p-5 bg-white border-t">
                  <Button className="w-full h-12 bg-primary rounded-xl font-bold">
                    Process Selection
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Dynamic Storefront Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
              Your Digital Storefront. <br />
              <span className="text-primary italic">Live in seconds.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Less calling, more conversion. Give your customers the digital experience 
              they deserve with a professional storefront.
            </p>

            {/* Premium Tabs */}
            <div className="flex justify-center gap-3 flex-wrap p-2 glass max-w-fit mx-auto rounded-[2rem] border-slate-200 shadow-xl">
              {[
                { id: 'house', label: 'Houses', icon: HomeIcon },
                { id: 'vehicle', label: 'Vehicles', icon: Car },
                { id: 'marketplace', label: 'Used Items', icon: ShoppingBag },
                { id: 'laundry', label: 'Laundry', icon: WashingMachine }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-primary'}`} /> 
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center min-h-[550px]">
            {/* Dynamic Mobile Mock UI */}
            <div className="relative mx-auto w-full max-w-[360px] perspective-[1000px]">
              <div className="border-[12px] border-slate-900 rounded-[3.5rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden aspect-[9/19] flex flex-col pt-10 relative group transition-transform duration-500 hover:rotate-y-3">
                
                <AnimatePresence mode="wait">
                  {/* HOUSE MOCK */}
                  {activeTab === 'house' && (
                    <motion.div 
                      key="house" 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col pt-10"
                    >
                      <div className="px-6 mb-6">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                          <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Storefront" />
                        </div>
                      </div>
                      <div className="px-8">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-2xl text-slate-900">Premium Suite</h3>
                          <ShieldCheck className="w-5 h-5 text-accent" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">City Center • Fully Furnished</p>

                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 mb-6">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">₹15,000</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase">/ Month</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          {['Wi-Fi', 'Parking', 'Security', 'AC'].map(a => (
                            <div key={a} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-accent" /> {a}
                            </div>
                          ))}
                        </div>

                        <Button className="w-full h-14 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                          Check Availability
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* VEHICLE MOCK */}
                  {activeTab === 'vehicle' && (
                    <motion.div 
                      key="vehicle" 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col pt-10"
                    >
                      <div className="px-6 mb-6">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                          <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Vehicle" />
                        </div>
                      </div>
                      <div className="px-8">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-2xl text-slate-900">BMW 5 Series</h3>
                          <Zap className="w-5 h-5 text-orange-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">Automatic • Diesel • Luxury</p>

                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 mb-6">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-orange-600">₹3,500</span>
                            <span className="text-xs font-bold text-orange-400 uppercase">/ Day</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                          {['Sunroof', 'Leather', 'GPS', 'Fastag'].map(a => (
                            <div key={a} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-orange-500" /> {a}
                            </div>
                          ))}
                        </div>

                        <Button className="w-full h-14 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20">
                          Book Instant
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* MARKETPLACE MOCK */}
                  {activeTab === 'marketplace' && (
                    <motion.div 
                      key="marketplace" 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col pt-10"
                    >
                      <div className="px-6 mb-6">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg bg-slate-50 flex items-center justify-center">
                          <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Laptop" />
                        </div>
                      </div>
                      <div className="px-8">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-black text-2xl text-slate-900">Dell XPS 13</h3>
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full">LIKE NEW</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">16GB RAM • 512GB SSD</p>

                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-700">₹45,000</span>
                            <span className="text-xs font-bold text-emerald-400 line-through">₹85K</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed mb-8">
                          Barely used for 6 months. Perfect for students and developers. 
                          Includes all original accessories.
                        </p>

                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-2">Offer</Button>
                          <Button className="flex-1 h-14 bg-emerald-600 rounded-2xl font-bold shadow-lg shadow-emerald-600/20">Buy Now</Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* LAUNDRY MOCK */}
                  {activeTab === 'laundry' && (
                    <motion.div 
                      key="laundry" 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex flex-col pt-10"
                    >
                      <div className="px-6 mb-6">
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-inner">
                           <WashingMachine className="w-24 h-24 text-white opacity-90 animate-bounce" />
                        </div>
                      </div>
                      <div className="px-8">
                        <h3 className="font-black text-2xl text-slate-900 mb-2">Premium Wash</h3>
                        <p className="text-sm text-muted-foreground mb-6">Pick-up & Drop included</p>

                        <div className="space-y-3 mb-8">
                           {['Shirts', 'Pants'].map((item, idx) => (
                             <div key={item} className="flex justify-between items-center bg-white p-4 border rounded-2xl shadow-sm">
                               <span className="text-sm font-bold">{item}</span>
                               <div className="flex items-center gap-4">
                                 <button className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold">-</button>
                                 <span className="text-sm font-black">{idx === 0 ? '5' : '2'}</span>
                                 <button className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">+</button>
                               </div>
                             </div>
                           ))}
                        </div>

                        <div className="flex justify-between items-center mb-6">
                           <span className="text-sm font-bold text-slate-500">Total Due</span>
                           <span className="text-2xl font-black text-blue-600">₹350</span>
                        </div>

                        <Button className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20">
                          Schedule Pick-up
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Floating Interaction Elements */}
              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -right-10 top-1/2 -translate-y-1/2 space-y-4 hidden md:block"
              >
                <div className="glass p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">₹</div>
                  <span className="text-[8px] font-black uppercase">Payment</span>
                </div>
                <div className="glass p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-primary font-bold">W</div>
                  <span className="text-[8px] font-black uppercase">Web Link</span>
                </div>
              </motion.div>
            </div>

            {/* Features List */}
            <div className="space-y-12">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    {storefrontFeatures[activeTab].map((feat, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-6 rounded-[2rem] border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <p className="text-xl font-bold text-slate-800 leading-snug">{feat}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white h-16 px-12 text-xl rounded-[2rem] font-bold shadow-2xl transition-all hover:-translate-y-1">
                      Build Your Storefront <ArrowRight className="ml-3 w-6 h-6" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trusted Partners / Testimonial */}
      <section className="py-32 relative bg-slate-50/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
            className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700 mb-32"
          >
            {['LOGO 1', 'LOGO 2', 'LOGO 3', 'LOGO 4', 'LOGO 5'].map(l => (
              <span key={l} className="font-black text-2xl tracking-tighter text-slate-400">{l}</span>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)]">
                <img src="https://images.unsplash.com/photo-1542314831-c5a4d408ebf3?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Success Story" />
                <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-10 left-10 right-10 flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-4 border-white shadow-xl">
                    <AvatarImage src="https://i.pravatar.cc/150?u=9" />
                  </Avatar>
                  <div>
                    <p className="text-white font-black text-xl">Rahul Sharma</p>
                    <p className="text-white/70 text-sm font-bold uppercase tracking-widest">Premium Vendor Partner</p>
                  </div>
                </div>
              </div>

              {/* Decorative Play Button */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl text-primary z-10"
              >
                <Play className="w-10 h-10 fill-current ml-2" />
              </motion.button>
            </motion.div>

            <div className="space-y-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-bold text-sm"
              >
                <Star className="w-4 h-4 fill-current" />
                <span>RATED 4.9/5 BY VENDORS</span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight"
              >
                Uniexo is the helper <br />
                <span className="text-primary">everyone trusts.</span>
              </motion.h2>

              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
                className="space-y-8"
              >
                <motion.p variants={fadeUp} className="text-2xl text-slate-600 font-medium leading-relaxed italic">
                  "Uniexo completely transformed how I list my properties. 
                  The automatic reminders and secure payments removed 90% of my daily stress."
                </motion.p>

                <motion.div variants={fadeUp} className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black text-lg">25+ Months</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Partner</span>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-black text-lg">500+ Deals</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completed</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary via-primary to-blue-900 -z-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
              READY TO <br />
              <span className="text-accent underline decoration-white/20 underline-offset-[20px]">GET STARTED?</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-2xl mx-auto">
              Join India's most innovative multi-service hub. 
              Sign up today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button size="lg" className="h-20 px-16 bg-white text-primary hover:bg-slate-50 text-2xl font-black rounded-[2.5rem] shadow-2xl transition-all hover:-translate-y-2">
                Join Now — It's Free
              </Button>
              <Button size="lg" variant="outline" className="h-20 px-16 bg-transparent border-4 border-white/20 text-white hover:bg-white/10 text-2xl font-black rounded-[2.5rem] transition-all hover:-translate-y-2">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (isAuthenticated && user?.role === 'admin') {
      router.push('/admin');
    }
  }, [isAuthenticated, user, router]);

  if (!isClient) return null;

  // If admin, we already started redirecting in useEffect, but to avoid flash:
  if (isAuthenticated && user?.role === 'admin') return null;

  return isAuthenticated ? <Dashboard /> : <Landing />;
}
