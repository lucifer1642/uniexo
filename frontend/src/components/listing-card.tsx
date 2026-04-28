import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Shield } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  href,
}: ListingCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleProceed = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    } else {
      router.push(href);
    }
  };

  return (
    <Card className="group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card border-border/50">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 cursor-pointer"
          onClick={handleProceed}
        />
        {category && (
          <Badge className="absolute left-3 top-3 bg-background/80 backdrop-blur-md text-foreground hover:bg-background/90 border-none px-3 font-medium">
            {category}
          </Badge>
        )}
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 flex-1 pr-4 cursor-pointer hover:text-primary transition-colors" onClick={handleProceed}>{title}</h3>
          {rating ? (
            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded-md text-xs font-semibold">
              <Star className="w-3 h-3 fill-current" />
              <span>{rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        
        <div className="mb-4">
          <span className="text-xl font-bold text-primary">₹{price.toLocaleString()}</span>
          {unit && <span className="text-sm text-muted-foreground ml-1">/ {unit}</span>}
        </div>

        {attributes.length > 0 && (
          <div className="grid grid-cols-4 gap-2 border-t pt-4 border-border/50">
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
            <Button className="w-full rounded-xl transition-all font-semibold cursor-pointer">
              Quick View
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] overflow-hidden p-0 bg-background border-none rounded-2xl">
            <div className="relative h-64 w-full bg-muted overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover" />
                <Badge className="absolute left-4 top-4 bg-background/80 backdrop-blur-md text-foreground border-none">
                    {category || type.toUpperCase()}
                </Badge>
            </div>
            
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
                        <DialogDescription className="mt-1">
                            {vendorName ? `By ${vendorName}` : 'Available for immediate booking'}
                        </DialogDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">₹{price.toLocaleString()}</div>
                        {unit && <div className="text-sm text-muted-foreground">/ {unit}</div>}
                    </div>
                </div>
                
                <div className="space-y-4 my-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        This premium {type} is meticulously maintained and verified by our team. 
                        Experience seamless booking and top-notch service with Uniexo.
                    </p>
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 py-2 px-3 rounded-lg w-fit">
                        <Shield className="w-4 h-4" />
                        Verified Listing
                    </div>
                </div>
                
                <Button className="w-full h-12 text-lg font-bold rounded-xl cursor-pointer" onClick={handleProceed}>
                    Proceed to Booking
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
