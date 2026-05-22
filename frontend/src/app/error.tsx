'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center theme-landing">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8 animate-pulse">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Something went <span className="text-red-500">wrong</span></h1>
      <p className="text-muted-foreground max-w-md mb-10 font-medium">
        An unexpected error occurred. Don't worry, your data is safe. We've been notified and are working on a fix.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button 
          onClick={() => reset()}
          className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-black hover:scale-105 transition-transform gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          TRY AGAIN
        </Button>
        
        <Button 
          asChild
          variant="outline"
          className="h-12 px-8 rounded-xl border-border font-black hover:bg-surface transition-colors gap-2"
        >
          <Link href="/">
            <Home className="w-4 h-4" />
            BACK HOME
          </Link>
        </Button>
      </div>

      <div className="mt-12 p-4 rounded-2xl bg-surface/50 border border-border/50 max-w-lg overflow-hidden">
         <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Error Diagnostic</p>
         <p className="text-[10px] font-mono text-red-400/70 break-all">{error.message || 'Unknown runtime error'}</p>
         {error.digest && <p className="text-[10px] font-mono text-muted-foreground mt-1 break-all">ID: {error.digest}</p>}
      </div>
    </div>
  );
}
