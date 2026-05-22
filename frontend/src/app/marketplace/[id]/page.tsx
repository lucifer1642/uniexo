'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin, Shield, Check, User, MessageCircle, Handshake, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMarketplaceItem } from '@/hooks/use-marketplace-items';
import { useCreateOffer } from '@/hooks/use-offers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function MarketplaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuthStore();
  
  const { data: item, isLoading, error } = useMarketplaceItem(id);

  const [activeImage, setActiveImage] = useState<string>('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [offerMessage, setOfferMessage] = useState('');
  
  const createOffer = useCreateOffer();

  useEffect(() => {
    if (item?.images?.length) {
      setActiveImage(item.images[0]);
    }
  }, [item]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
        <p className="text-muted-foreground mb-6">The item you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/marketplace')}>Back to Marketplace</Button>
      </div>
    );
  }

  const handleDirectBuy = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/marketplace/${id}`);
      return;
    }
    if (user?.id === (item.sellerId as any)?._id || user?.id === item.sellerId) {
      toast.error('You cannot buy your own item.');
      return;
    }
    
    try {
      await createOffer.mutateAsync({
        itemId: id,
        offeredPrice: item.price,
        message: 'I want to buy this directly at the listed price.'
      });
      toast.success('Purchase request sent! The seller will contact you.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit buy request.');
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || isNaN(Number(offerPrice)) || Number(offerPrice) <= 0) {
      toast.error('Please enter a valid offer price.');
      return;
    }

    try {
      await createOffer.mutateAsync({
        itemId: id,
        offeredPrice: Number(offerPrice),
        message: offerMessage || 'I would like to make an offer for your item.',
      });
      toast.success('Offer submitted successfully! You can track it in your dashboard.');
      setIsOfferModalOpen(false);
      setOfferPrice('');
      setOfferMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit offer.');
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-6xl theme-food">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{item.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{typeof item.location === 'string' ? item.location : 'Location TBD'}</span>
          </div>
          <div className="flex items-center gap-1">
             <span className="font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{item.category}</span>
          </div>
          <div className="flex items-center gap-1">
             <span className="px-2 py-0.5 bg-muted rounded-full uppercase">{item.condition}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <div className="space-y-4">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-muted border flex items-center justify-center">
              <img src={activeImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'} 
                   alt={item.title} className="w-full h-full object-contain bg-black/5" />
            </div>
            {item.images && item.images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {item.images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {item.description || 'No description provided by seller.'}
            </p>
          </div>

          <div className="py-6 border-y">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{(item.sellerId as any)?.name || 'Seller'}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Joined Date hidden</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div>
          <Card className="p-6 sticky top-24 border shadow-xl shadow-primary/5">
            <div className="mb-6">
              <span className="text-3xl font-bold">₹{item.price.toFixed(2)}</span>
            </div>

            <div className="space-y-4 mb-6 pt-4 border-t">
               <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Condition</span>
                  <span className="capitalize">{item.condition}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Status</span>
                  <span className={item.isSold ? "text-destructive" : "text-emerald-500"}>
                     {item.isSold ? 'Sold Out' : 'Available'}
                  </span>
               </div>
            </div>

            {item.isSold ? (
              <Button size="lg" className="w-full text-base font-semibold" disabled>
                Item Sold
              </Button>
            ) : (
              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full text-base font-semibold" 
                  onClick={handleDirectBuy}
                  disabled={createOffer.isPending}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" /> Buy at Listed Price
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full text-base font-semibold" 
                  onClick={() => {
                    if (!isAuthenticated) {
                      router.push(`/login?redirect=/marketplace/${id}`);
                      return;
                    }
                    if (user?.id === (item.sellerId as any)?._id || user?.id === item.sellerId) {
                      toast.error('You cannot make an offer on your own item.');
                      return;
                    }
                    setOfferPrice('');
                    setOfferMessage('');
                    setIsOfferModalOpen(true);
                  }}
                  disabled={createOffer.isPending}
                >
                  <Handshake className="w-5 h-5 mr-2" /> Make an Offer
                </Button>
              </div>
            )}

            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground text-center">
              <div className="flex items-center gap-1">
                 <Shield className="w-4 h-4" />
                 <span>Buyer Protection Program</span>
              </div>
              <span>Do not send payment before inspecting the item.</span>
            </div>
          </Card>
        </div>
      </div>
    </div>

      {/* Make Offer Dialog */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Propose a different price to the seller. They can choose to accept or reject your offer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Your Offer Price (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount..." 
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Message to Seller (Optional)</Label>
              <Textarea 
                placeholder="Hi, would you be willing to accept..." 
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMakeOffer} disabled={createOffer.isPending || !offerPrice}>
              {createOffer.isPending ? 'Submitting...' : 'Submit Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
