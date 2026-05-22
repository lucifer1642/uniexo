import React from 'react';
import { cn } from '@/lib/utils';

interface UniExoBrandProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UniExoBrand = ({ className, size = 'md' }: UniExoBrandProps) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-xl md:text-2xl',
    lg: 'text-3xl md:text-4xl',
    xl: 'text-5xl md:text-7xl',
  };

  return (
    <span className={cn(
      "font-black tracking-tighter uppercase inline-flex items-center group transition-all hover:scale-105",
      sizeClasses[size],
      className
    )}>
      <span className="text-white group-hover:text-white/90 transition-colors">UNI</span>
      <span className="text-accent italic font-black relative ml-0.5 group-hover:text-accent/80 transition-colors">
        EXO
        <span className="absolute -bottom-1 left-0 w-full h-1 bg-accent/40 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-accent ml-1 shadow-[0_0_8px_rgba(201,168,76,0.6)] animate-pulse" />
    </span>
  );
};
