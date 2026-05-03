import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { GlobalProfileSidebar } from "@/components/global-profile-sidebar";
import { CacheManager } from "@/components/cache-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marketplace Platform",
  description: "Multi-service marketplace for vehicles, houses, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <CacheManager />
          <Navbar />
          <GlobalProfileSidebar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
        <Toaster 
          position="bottom-right" 
          closeButton 
          toastOptions={{
            classNames: {
              success: 'border-primary bg-black text-primary shadow-[0_0_15px_rgba(139,0,74,0.4)]',
              error: 'border-red-500 bg-black text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
              toast: 'border bg-black/90 backdrop-blur-md rounded-lg font-medium tracking-wide',
              closeButton: 'bg-zinc-800 hover:bg-zinc-700 text-white border-none'
            },
            duration: 4000,
          }} 
        />
      </body>
    </html>
  );
}
