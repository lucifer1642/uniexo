'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/listing-card';
import { SearchBar } from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Filter } from 'lucide-react';

import { useMarketplaceItems } from '@/hooks/use-marketplace-items';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { ShoppingBag, Tag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { AddMarketplaceItemDialog } from '@/components/add-marketplace-item-dialog';

function VendorGroup({ vendorName, items }: { vendorName: string, items: any[] }) {
  const renderCard = (item: any) => (
    <Link key={item.id} href={item.href} className="group flex flex-col gap-3 cursor-pointer tap-feedback">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center">
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ShoppingBag className="w-12 h-12 opacity-20 mb-2" />
          </div>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="p-2 rounded-full bg-surface shadow-lg text-primary">
              <Tag className="w-4 h-4" />
           </div>
        </div>
      </div>
      <div className="flex flex-col px-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.vendorName}</h3>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
        </div>
        <div className="text-muted-foreground text-sm line-clamp-1 capitalize mb-2">{item.title}</div>
        <div className="flex items-center justify-between">
           <span className="font-black text-lg text-foreground">₹{item.price}</span>
           <div className="text-[10px] font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
              VIEW ITEM <ShoppingBag className="w-3 h-3" />
           </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6 mb-16 w-full pt-8 border-t border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          Shared by {vendorName}
        </h2>
        <div className="text-xs font-bold text-muted-foreground bg-surface border border-border px-3 py-1 rounded-full uppercase tracking-widest">
           {items.length} ITEMS
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {items.map(renderCard)}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data: items, isLoading } = useMarketplaceItems();
  const { user } = useAuthStore();

  const canSell = user?.role === 'user' || user?.role === 'vendor';

  const mappedItems = (items || []).map(item => ({
    id: item._id,
    title: item.title,
    type: 'marketplace' as const,
    price: item.price,
    unit: 'total',
    image: item.images?.[0] || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80',
    category: item.category,
    vendorName: item.sellerId?.name || 'Unknown Seller',
    href: `/marketplace/${item._id}`,
  }));

  const filteredItems = mappedItems.filter(v => {
    if (categoryFilter !== 'all') {
      return v.category.toLowerCase() === categoryFilter.toLowerCase();
    }
    return true;
  });

  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books'];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-20 theme-marketplace">
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
                  <ShoppingBag className="w-3 h-3" />
                  Campus Marketplace
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                  Second-hand <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary font-black">Treasures.</span>
                </h1>
                <p className="text-muted-foreground text-lg font-medium">Buy and sell pre-loved items within the campus community. Sustainable and affordable.</p>
              </motion.div>
            </div>
            {canSell && <AddMarketplaceItemDialog />}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-16 p-2 bg-surface/40 border border-border rounded-3xl backdrop-blur-3xl">
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={() => setCategoryFilter('all')}
              className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              ALL ITEMS
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat.toLowerCase() ? 'all' : cat.toLowerCase())}
                className={`px-8 py-3 rounded-2xl text-xs font-black tracking-widest transition-all ${categoryFilter === cat.toLowerCase() ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {filteredItems.length} Available Listings
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-[2rem] bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              Object.entries(
                filteredItems.reduce((acc, item) => {
                  const vendorName = item.vendorName || 'Independent Seller';
                  if (!acc[vendorName]) {
                    acc[vendorName] = { items: [] };
                  }
                  acc[vendorName].items.push(item);
                  return acc;
                }, {} as Record<string, { items: typeof filteredItems }>)
              )
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([vendorName, data]) => (
                <VendorGroup 
                  key={vendorName} 
                  vendorName={vendorName} 
                  items={data.items} 
                />
              ))
            ) : (
              <div className="text-center py-40 border border-dashed border-border rounded-[3rem]">
                <Tag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-2">No items found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to find what you're looking for.</p>
                <Button 
                  onClick={() => setCategoryFilter('all')}
                  variant="outline" 
                  className="mt-8 border-primary/30 text-primary hover:bg-primary/5 rounded-2xl px-10 h-14 font-black"
                >
                  CLEAR FILTERS
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
