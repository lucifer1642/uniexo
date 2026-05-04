'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, MapPin, Star, ShieldCheck, Heart, Coffee, Wifi, Car, ArrowRight, LayoutGrid, List } from 'lucide-react';
import { useHouses } from '@/hooks/use-houses';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { AddHouseDialog } from '@/components/add-house-dialog';
import { Badge } from '@/components/ui/badge';

function HouseCard({ room }: { room: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col bg-[#1a050f] border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-primary/30 shadow-2xl"
    >
      <Link href={room.href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {room.image ? (
            <img 
              src={room.image} 
              alt={room.title} 
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-700">
              <Home className="w-16 h-16 opacity-10" />
            </div>
          )}
          
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <button className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-red-400 transition-colors shadow-xl">
                <Heart className="w-4 h-4" />
             </button>
          </div>

          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className="bg-lime-400 text-black font-black text-[10px] uppercase tracking-tighter px-3 border-none">
              VERIFIED
            </Badge>
            {room.propertyType === 'pg' && (
              <Badge className="bg-blue-500 text-white font-black text-[10px] uppercase tracking-tighter px-3 border-none">
                PREMIUM PG
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-xl leading-tight group-hover:text-lime-400 transition-colors line-clamp-1">{room.title}</h3>
            <div className="flex items-center gap-1 text-xs font-black text-lime-400">
              <Star className="w-3 h-3 fill-current" />
              <span>4.9</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-medium mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{room.rawLocation}</span>
          </div>

          <div className="flex gap-4 mb-6">
             <div className="flex items-center gap-1.5 text-zinc-400">
                <Wifi className="w-4 h-4" />
                <span className="text-[10px] font-bold">WIFI</span>
             </div>
             <div className="flex items-center gap-1.5 text-zinc-400">
                <Car className="w-4 h-4" />
                <span className="text-[10px] font-bold">PARKING</span>
             </div>
             <div className="flex items-center gap-1.5 text-zinc-400">
                <Coffee className="w-4 h-4" />
                <span className="text-[10px] font-bold">FOOD</span>
             </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">₹{room.propertyType === 'pg' ? room.pricePerMonth : room.pricePerDay}</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">/ {room.propertyType === 'pg' ? 'MONTH' : 'DAY'}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-black transition-all duration-500">
               <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function VendorGroup({ vendorName, rooms }: { vendorName: string, rooms: any[] }) {
  return (
    <div className="space-y-8 mb-20 relative">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase mb-1">MANAGED BY</span>
           <h2 className="text-2xl font-black tracking-tighter text-white">{vendorName}</h2>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rooms.map(room => (
          <HouseCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}

export default function HousesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'pg' | 'room'>('all');
  const { data: rooms, isLoading } = useHouses();
  const { user } = useAuthStore();
  const isVendor = user?.role === 'vendor';

  const mappedRooms = (rooms || []).map(r => ({
    id: r._id,
    title: r.title,
    type: 'house' as const,
    propertyType: r.propertyType,
    pricePerMonth: r.pricePerMonth || 0,
    pricePerDay: r.pricePerDay || 0,
    image: r.images?.[0] || '',
    vendorName: r.vendorId?.name || 'Unknown Vendor',
    rating: 0,
    href: `/houses/${r._id}`,
    rawLocation: r.city || r.address || '',
  }));

  const filteredRooms = mappedRooms.filter(v => {
    const type = v.propertyType?.toLowerCase();
    if (typeFilter === 'pg') return type === 'pg';
    if (typeFilter === 'room') return type === 'room';
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 pb-20">
      {/* Hero Header */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-lime-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-2xl">
               <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
               >
                 <Badge className="bg-lime-400/10 text-lime-400 border-lime-400/20 mb-4 font-black tracking-widest px-4 py-1">
                    VERIFIED STAYS
                 </Badge>
                 <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                    Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500">Perfect Stay.</span>
                 </h1>
                 <p className="text-zinc-500 text-lg font-medium">Explore hand-picked PGs and Rooms verified for quality and safety across the campus.</p>
               </motion.div>
            </div>
            {isVendor && <AddHouseDialog />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-16 p-2 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
          <div className="flex gap-2">
             <button 
                onClick={() => setTypeFilter('all')}
                className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all ${typeFilter === 'all' ? 'bg-lime-400 text-black shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)]' : 'text-zinc-500 hover:text-white'}`}
             >
                ALL STAYS
             </button>
             <button 
                onClick={() => setTypeFilter('pg')}
                className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all ${typeFilter === 'pg' ? 'bg-lime-400 text-black shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)]' : 'text-zinc-500 hover:text-white'}`}
             >
                PGs ONLY
             </button>
             <button 
                onClick={() => setTypeFilter('room')}
                className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all ${typeFilter === 'room' ? 'bg-lime-400 text-black shadow-[0_0_20px_-5px_rgba(255,0,127,0.5)]' : 'text-zinc-500 hover:text-white'}`}
             >
                ROOMS ONLY
             </button>
          </div>
          
          <div className="hidden md:flex items-center gap-6 pr-6">
             <div className="text-xs font-black text-zinc-500 tracking-widest uppercase">
                {filteredRooms.length} RESULTS FOUND
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-lime-400"><LayoutGrid className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="text-zinc-600"><List className="w-4 h-4" /></Button>
             </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[2rem] bg-white/[0.02] border border-white/5 animate-pulse" />
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
                  filteredRooms.reduce((acc, room) => {
                    const vendorName = room.vendorName || 'Independent Hosts';
                    if (!acc[vendorName]) {
                      acc[vendorName] = { rooms: [] };
                    }
                    acc[vendorName].rooms.push(room);
                    return acc;
                  }, {} as Record<string, { rooms: typeof filteredRooms }>)
                )
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([vendorName, data]) => (
                  <VendorGroup 
                    key={vendorName} 
                    vendorName={vendorName} 
                    rooms={data.rooms} 
                  />
                ))}

                {filteredRooms.length === 0 && (
                  <div className="text-center py-40 border border-dashed border-white/10 rounded-[3rem]">
                    <Home className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                    <h3 className="text-2xl font-black mb-2">No matches found</h3>
                    <p className="text-zinc-500">We couldn't find any stays matching your criteria.</p>
                    <Button 
                      onClick={() => setTypeFilter('all')}
                      variant="outline" 
                      className="mt-8 border-lime-400/30 text-lime-400 hover:bg-lime-400/5 rounded-2xl px-10 h-14 font-black"
                    >
                      CLEAR FILTERS
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
