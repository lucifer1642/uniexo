import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  className?: string;
}

export function RatingStars({ rating, maxStars = 5, className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));

        return (
          <div key={index} className="relative">
            <Star className="h-4 w-4 text-muted-foreground/30" />
            <div
              className="absolute left-0 top-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
