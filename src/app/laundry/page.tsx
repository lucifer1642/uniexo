'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Search, WashingMachine, Star, MapPin, ShieldCheck, Heart, Clock, Truck, ArrowRight, LayoutGrid, List, Zap, Sparkles } from 'lucide-react';
import { useLaundryServices } from '@/hooks/use-laundry-services';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { AddLaundryServiceDialog } from '@/components/add-laundry-service-dialog';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';

function LaundryCard({ service }: { service: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col glass rounded-[2.5rem] md:rounded-[3rem] overflow-hidden transition-all duration-500 hover:border-primary/30 shadow-2xl glow-border tap-feedback"
    >
      <Link href={service.href} className="block">
        <div className="relative aspect-video overflow-hidden">
          {service.image ? (
            <img 
              src={service.image} 
              alt={service.title} 
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full bg-surface flex flex-col items-center justify-center text-muted-foreground">
              <WashingMachine className="w-16 h-16 opacity-10" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-4 right-4">
             <div className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] font-black tracking-widest uppercase">
                EXPRESS
             </div>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            {service.onsitePickup && (
              <Badge className="bg-emerald-500 text-white font-black text-[10px] uppercase tracking-tighter px-3 border-none">
                DOORSTEP PICKUP
              </Badge>
            )}
            {service.onStoreService && (
              <Badge className="bg-surface text-foreground font-black text-[10px] uppercase tracking-tighter px-3 border border-border">
                IN-STORE
              </Badge>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-2xl leading-tight group-hover:text-primary transition-colors line-clamp-1 text-foreground">{service.title}</h3>
            <div className="flex items-center gap-1 text-xs font-black text-primary">
              <Star className="w-3 h-3 fill-current" />
              <span>4.7</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium mb-6">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{service.vendorName}</span>
          </div>

          <div className="flex gap-4 mb-8">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground">24HR RETURN</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground">HYGIENIC</span>
             </div>
          </div>

          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">STARTING AT</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-foreground group-hover:text-primary transition-colors">₹{service.price}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">/ {service.unit}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-2xl">
               <ArrowRight className="w-6 h-6" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function LaundryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: services, isLoading } = useLaundryServices();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const mappedServices = (services || []).map(service => ({
    id: service._id,
    title: service.name,
    type: 'laundry' as const,
    price: service.services?.[0]?.price || 0,
    unit: service.services?.[0]?.unit || 'pc',
    image: service.images?.[0] || '',
    category: 'Laundry',
    vendorName: service.providerName || 'Independent Provider',
    rating: 0,
    href: `/laundry/${service._id}`,
    onsitePickup: service.onsitePickup,
    onStoreService: service.onStoreService,
  }));

  const filteredServices = mappedServices.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 theme-laundry">
      {/* Hero Header */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
               >
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] mb-4 uppercase">
                    <Sparkles className="w-3 h-3" />
                    PREMIUM FABRIC CARE
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                    Freshness, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary font-black">Delivered.</span>
                 </h1>
                 <p className="text-muted-foreground text-lg font-medium">Professional wash, dry clean, and ironing services at your doorstep. Fast, hygienic, and affordable.</p>
               </motion.div>
            </div>
            {isAdmin && <AddLaundryServiceDialog />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-16">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search for providers or services..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-16 pl-16 pr-8 bg-surface/40 border border-border rounded-3xl focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-lg placeholder:text-muted-foreground"
              />
           </div>
           
           <div className="hidden lg:flex items-center gap-6 pl-4 border-l border-border">
              <div className="text-center">
                 <div className="text-2xl font-black text-primary tracking-tighter">{filteredServices.length}</div>
                 <div className="text-[8px] font-black text-muted-foreground tracking-[0.2em] uppercase">PROVIDERS</div>
              </div>
              <div className="flex gap-2">
                 <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-surface text-primary hover:bg-primary hover:text-primary-foreground transition-all">
                    <LayoutGrid className="w-5 h-5" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-surface/50 text-muted-foreground">
                    <List className="w-5 h-5" />
                 </Button>
              </div>
           </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-[2.5rem] bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="wait">
               <motion.div
                 key="laundry-grid"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.5 }}
                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
               >
                 {filteredServices.map((service) => (
                   <LaundryCard key={service.id} service={service} />
                 ))}

                 {filteredServices.length === 0 && (
                   <div className="col-span-full text-center py-40 border border-dashed border-white/10 rounded-[3rem]">
                     <WashingMachine className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                     <h3 className="text-2xl font-black mb-2">No services found</h3>
                     <p className="text-zinc-500">We couldn't find any laundry providers matching your search.</p>
                     <Button 
                       onClick={() => setSearchTerm('')}
                       variant="outline" 
                       className="mt-8 border-purple-500/30 text-purple-400 hover:bg-purple-500/5 rounded-2xl px-10 h-14 font-black"
                     >
                       RESET SEARCH
                     </Button>
                   </div>
                 )}
               </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
