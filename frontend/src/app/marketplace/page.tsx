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
import { AddMarketplaceItemDialog } from '@/components/add-marketplace-item-dialog';

function VendorGroup({ vendorName, location, items }: { vendorName: string, location: string, items: any[] }) {
  const renderCard = (item: any) => (
    <Link key={item.id} href={item.href} className="group flex flex-col gap-3 cursor-pointer">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted flex items-center justify-center">
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
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-base line-clamp-1">{item.vendorName}</h3>
          <div className="flex items-center gap-1 text-sm">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{item.category}</span>
          </div>
        </div>
        <div className="text-muted-foreground text-sm line-clamp-1 capitalize">{item.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-base text-foreground">₹{item.price}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4 mb-10 w-full pt-4 border-t">
      <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
        <User className="w-5 h-5 text-muted-foreground" />
        Shared by {vendorName}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8">
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Used Items Marketplace</h1>
          <p className="text-muted-foreground">Discover second-hand treasures at great prices.</p>
        </div>
        {canSell && <AddMarketplaceItemDialog />}
      </div>

      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="text-sm font-medium text-muted-foreground">
          Showing {filteredItems.length} items
        </div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          <Button 
            size="sm"
            variant={categoryFilter === 'all' ? 'default' : 'outline'} 
            className={categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : ''}
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat}
              size="sm"
              variant={categoryFilter === cat.toLowerCase() ? 'default' : 'outline'} 
              className={categoryFilter === cat.toLowerCase() ? 'bg-primary text-primary-foreground' : ''}
              onClick={() => setCategoryFilter(categoryFilter === cat.toLowerCase() ? 'all' : cat.toLowerCase())}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="space-y-12">
            {Object.entries(
              filteredItems.reduce((acc, item) => {
                const vendorName = item.vendorName || 'Independent Seller';
                if (!acc[vendorName]) {
                  acc[vendorName] = {
                    location: 'Multiple Locations',
                    items: []
                  };
                }
                acc[vendorName].items.push(item);
                return acc;
              }, {} as Record<string, { location: string, items: typeof filteredItems }>)
            )
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([vendorName, data]) => (
              <VendorGroup 
                key={vendorName} 
                vendorName={vendorName} 
                location={data.location} 
                items={data.items} 
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No items found. Try adjusting your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}
