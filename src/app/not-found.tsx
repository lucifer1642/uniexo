'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center theme-landing overflow-hidden relative">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-10">
        <h1 className="text-[20rem] font-black tracking-tighter select-none">404</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="w-24 h-24 rounded-[2.5rem] bg-surface border border-border flex items-center justify-center text-primary mb-8 mx-auto shadow-2xl">
          <Search className="w-10 h-10" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
          Page <span className="text-primary">Not Found</span>
        </h1>
        <p className="text-muted-foreground max-w-md mb-10 font-medium text-lg">
          The coordinate you're looking for doesn't exist in the UniExo ecosystem. It might have been moved or archived.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            asChild
            className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black hover:scale-105 transition-transform gap-3 shadow-xl shadow-primary/20"
          >
            <Link href="/">
              <Home className="w-5 h-5" />
              BACK TO HOME
            </Link>
          </Button>
          
          <Button 
            variant="ghost"
            onClick={() => window.history.back()}
            className="h-14 px-8 rounded-2xl font-black text-muted-foreground hover:text-foreground transition-colors gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            GO BACK
          </Button>
        </div>
      </motion.div>

      {/* Subtle Micro-details */}
      <div className="mt-20 flex items-center gap-8 opacity-30 grayscale pointer-events-none">
         <div className="h-px w-12 bg-border" />
         <span className="text-[10px] font-black uppercase tracking-[0.5em]">UniExo Core</span>
         <div className="h-px w-12 bg-border" />
      </div>
    </div>
  );
}
