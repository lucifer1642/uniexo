'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Bike, MapPin, Star, ShieldCheck, Heart, Fuel, Users, Gauge, ArrowRight, LayoutGrid, List, Zap } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAuthStore } from '@/modules/auth/auth.store';
import Link from 'next/link';
import { AddVehicleDialog } from '@/components/add-vehicle-dialog';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';

function VehicleCard({ vehicle }: { vehicle: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -10 }}
      className="group relative flex flex-col glass rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-primary/30 shadow-2xl glow-border tap-feedback"
    >
      <Link href={vehicle.href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          {vehicle.image ? (
            <img 
              src={vehicle.image} 
              alt={vehicle.title} 
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full bg-surface flex flex-col items-center justify-center text-muted-foreground">
              <Car className="w-16 h-16 opacity-10" />
            </div>
          )}
          
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-accent transition-colors shadow-xl">
                <Heart className="w-4 h-4" />
             </button>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-tighter px-3 border-none">
              INSTANT BOOK
            </Badge>
            {vehicle.rawType?.toLowerCase() === 'car' ? (
              <Badge className="bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-tighter px-3 border border-white/10">
                PREMIUM
              </Badge>
            ) : (
              <Badge className="bg-accent text-accent-foreground font-black text-[10px] uppercase tracking-tighter px-3 border-none">
                POPULAR
              </Badge>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-lg md:text-xl leading-tight group-hover:text-primary transition-colors line-clamp-1">{vehicle.title}</h3>
            <div className="flex items-center gap-1 text-xs font-black text-primary">
              <Star className="w-3 h-3 fill-current" />
              <span>4.8</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{vehicle.rawLocation}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-4 md:mb-6">
             <div className="flex flex-col items-center p-1.5 md:p-2 rounded-xl md:rounded-2xl bg-surface/40 border border-border">
                <Fuel className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground mb-0.5 md:mb-1" />
                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-wider">PETROL</span>
             </div>
             <div className="flex flex-col items-center p-1.5 md:p-2 rounded-xl md:rounded-2xl bg-surface/40 border border-border">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground mb-0.5 md:mb-1" />
                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-wider">5 SEATS</span>
             </div>
             <div className="flex flex-col items-center p-1.5 md:p-2 rounded-xl md:rounded-2xl bg-surface/40 border border-border">
                <Gauge className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground mb-0.5 md:mb-1" />
                <span className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-wider">AUTO</span>
             </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">₹{vehicle.pricePerDay}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">/ DAY</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5 opacity-50">
                <span className="text-sm font-bold text-foreground">₹{vehicle.pricePerHour}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">/ HOUR</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-2xl">
               <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function VendorGroup({ vendorName, vehicles }: { vendorName: string, vehicles: any[] }) {
  return (
    <div className="space-y-8 mb-20 relative">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase mb-1 text-center">CERTIFIED PARTNER</span>
           <h2 className="text-2xl font-black tracking-tighter text-foreground text-center">{vendorName}</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-8">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'car' | 'bike'>('all');
  const { data: vehicles, isLoading } = useVehicles();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  const mappedVehicles = (vehicles || []).map(v => ({
    id: v._id,
    title: v.name,
    type: 'vehicle' as const,
    pricePerDay: v.pricePerDay || 0,
    pricePerHour: v.pricePerHour || Math.round((v.pricePerDay || 0) / 24) || 0,
    image: v.images?.[0] || '',
    vendorName: v.vendorId?.name || 'Unknown Vendor',
    rating: 4.8,
    href: `/vehicles/${v._id}`,
    rawType: v.type,
    rawLocation: typeof v.location === 'string' ? v.location : (v as any).location?.address || '',
  }));

  const filteredVehicles = mappedVehicles.filter(v => {
    const type = v.rawType?.toLowerCase();
    if (typeFilter === 'car') return type === 'car';
    if (typeFilter === 'bike') return ['bike', 'scooter'].includes(type);
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 has-bottom-nav md:pb-20 theme-car">
      {/* Hero Header */}
      <div className="relative pt-10 md:pt-20 pb-8 md:pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] md:h-[500px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8">
            <div className="max-w-2xl">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
               >
                 <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 md:mb-4 font-black tracking-widest px-3 md:px-4 py-1 text-[10px] md:text-xs">
                    ELITE RENTALS
                 </Badge>
                 <h1 className="text-3xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-3 md:mb-6">
                    Your ride, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary font-black">Redefined.</span>
                 </h1>
                 <p className="text-muted-foreground text-sm md:text-lg font-medium">Rent verified cars and bikes with ease.</p>
               </motion.div>
            </div>
            {isVendor && <AddVehicleDialog />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* Filter Bar */}
        <div className="flex justify-between items-center gap-4 mb-8 md:mb-16 p-1.5 md:p-2 bg-surface border border-border rounded-2xl md:rounded-3xl shadow-2xl overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
             <button 
                onClick={() => { setTypeFilter('all'); haptics.selection(); }}
                className={`px-4 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black tracking-widest transition-all whitespace-nowrap tap-feedback ${typeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]' : 'text-muted-foreground hover:text-foreground'}`}
             >
                ALL
             </button>
             <button 
                onClick={() => { setTypeFilter('car'); haptics.selection(); }}
                className={`px-4 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black tracking-widest transition-all whitespace-nowrap tap-feedback ${typeFilter === 'car' ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]' : 'text-muted-foreground hover:text-foreground'}`}
             >
                CARS
             </button>
             <button 
                onClick={() => { setTypeFilter('bike'); haptics.selection(); }}
                className={`px-4 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black tracking-widest transition-all whitespace-nowrap tap-feedback ${typeFilter === 'bike' ? 'bg-primary text-primary-foreground shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]' : 'text-muted-foreground hover:text-foreground'}`}
             >
                BIKES
             </button>
          </div>
          
          <div className="hidden md:flex items-center gap-6 pr-6">
             <div className="text-xs font-black text-muted-foreground tracking-widest uppercase">
                {filteredVehicles.length} FLEET ASSETS
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary"><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground"><List className="w-4 h-4" /></Button>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 py-10 md:py-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[16/11] rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            <AnimatePresence mode="wait">
               <motion.div
                 key={typeFilter}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.3 }}
               >
                {Object.entries(
                  filteredVehicles.reduce((acc, vehicle) => {
                    const vendorName = vehicle.vendorName || 'Independent Hosts';
                    if (!acc[vendorName]) {
                      acc[vendorName] = { vehicles: [] };
                    }
                    acc[vendorName].vehicles.push(vehicle);
                    return acc;
                  }, {} as Record<string, { vehicles: typeof filteredVehicles }>)
                )
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([vendorName, data]) => (
                  <VendorGroup 
                    key={vendorName} 
                    vendorName={vendorName} 
                    vehicles={data.vehicles} 
                  />
                ))}

                {filteredVehicles.length === 0 && (
                  <div className="text-center py-40 border border-dashed border-white/10 rounded-[3rem]">
                    <Car className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                    <h3 className="text-2xl font-black mb-2">Fleet not found</h3>
                    <p className="text-zinc-500">We couldn't find any vehicles matching your preference.</p>
                    <Button 
                      onClick={() => setTypeFilter('all')}
                      variant="outline" 
                      className="mt-8 border-blue-500/30 text-blue-400 hover:bg-blue-500/5 rounded-2xl px-10 h-14 font-black"
                    >
                      RESET FILTERS
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
