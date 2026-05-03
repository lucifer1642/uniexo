import Image from 'next/image';
import Link from 'next/link';
import { Users, Zap, Fuel, Settings, Star, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface Attribute {
  icon: React.ElementType;
  label: string;
  value: string;
}

interface ListingCardProps {
  id: string;
  title: string;
  type: 'vehicle' | 'house' | 'marketplace' | 'laundry';
  price: number;
  unit?: string;
  image: string;
  rating?: number;
  category?: string;
  attributes?: Attribute[];
  vendorName?: string;
  vendorId?: string;
  href: string;
}

export function ListingCard({
  id,
  title,
  type,
  price,
  unit = 'day',
  image,
  rating,
  category,
  attributes = [],
  vendorName,
  vendorId,
  href,
}: ListingCardProps) {
  const { user } = useAuthStore();
  const isOwner = user?.id === vendorId;

  return (
    <Card className="group overflow-hidden rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] bg-card border-border/50">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative w-full h-full cursor-pointer group/image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={title}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="text-white w-8 h-8" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="w-full h-full object-contain" />
          </DialogContent>
        </Dialog>
        
        {category && (
          <Badge className="absolute left-3 top-3 bg-background/80 backdrop-blur-md text-foreground hover:bg-background/90 border-none px-3 font-medium">
            {category}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 md:p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 flex-1 pr-4">{title}</h3>
          {rating ? (
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded-md text-xs font-semibold">
              <Star className="w-3 h-3 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        
        <div className="mb-4">
          <span className="text-xl font-bold text-primary">₹{price.toFixed(2)}</span>
          {unit && <span className="text-sm text-muted-foreground ml-1">/ {unit}</span>}
        </div>

        {attributes.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 md:gap-2 border-t pt-3 md:pt-4 border-border/50">
            {attributes.map((attr, index) => {
              const Icon = attr.icon;
              return (
                <div key={index} className="flex flex-col items-center justify-center text-center">
                  <Icon className="w-4 h-4 text-muted-foreground mb-1.5" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{attr.label}</span>
                  <span className="text-xs font-semibold mt-0.5">{attr.value}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {vendorName && type !== 'marketplace' && (
           <p className="text-xs text-muted-foreground mt-4 overflow-hidden text-ellipsis whitespace-nowrap">
             By <span className="font-medium text-foreground">{vendorName}</span>
           </p>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t mt-auto border-border/5">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full rounded-xl transition-all font-semibold cursor-pointer h-11 md:h-12 tap-feedback">
              {isOwner ? 'Manage Listing' : 'View Details & Book'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] overflow-hidden p-0 bg-background border-none rounded-2xl">
            <div className="relative">
              <div className="h-64 w-full bg-muted overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={title} className="w-full h-full object-cover" />
              </div>
              <Badge className="absolute left-4 top-4 bg-background/80 backdrop-blur-md text-foreground border-none">
                {category || type.toUpperCase()}
              </Badge>
            </div>
            
            <div className="p-6 md:p-8 pt-4">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                   {vendorName && <p className="text-muted-foreground text-sm mt-1">By {vendorName}</p>}
                 </div>
                 <div className="text-right">
                   <div className="text-2xl font-bold text-primary">₹{price.toFixed(2)}</div>
                   {unit && <div className="text-sm text-muted-foreground">/ {unit}</div>}
                 </div>
               </div>
               
               {attributes.length > 0 && (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y my-4">
                   {attributes.map((attr, index) => {
                     const Icon = attr.icon;
                     return (
                       <div key={index} className="flex items-center gap-2">
                         <Icon className="w-5 h-5 text-muted-foreground" />
                         <div>
                           <p className="text-xs text-muted-foreground">{attr.label}</p>
                           <p className="text-sm font-semibold">{attr.value}</p>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
               
               <div className="mt-6">
                 <h4 className="font-semibold mb-2">Description</h4>
                 <p className="text-sm text-muted-foreground leading-relaxed">
                   This premium {type} is available for booking immediately. Enjoy our top-tier service, guaranteed clean, tested, and reliable. Book now to secure your dates.
                 </p>
               </div>
               
               {!isOwner && (
                 <div className="mt-8 pt-4 flex gap-4">
                    <Button 
                      className="flex-1 py-6 text-lg font-bold cursor-pointer"
                      onClick={() => {
                         if (!user) {
                           window.location.href = `/login?redirect=${encodeURIComponent(href)}`;
                         } else {
                           window.location.href = href;
                         }
                      }}
                    >
                      Confirm & Proceed to Book
                    </Button>
                 </div>
               )}

               {isOwner && (
                 <div className="mt-8 pt-4">
                    <Button 
                      variant="outline"
                      className="w-full py-6 text-lg font-bold cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/listings/${id}`}
                    >
                      Go to Dashboard to Manage
                    </Button>
                 </div>
               )}
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
