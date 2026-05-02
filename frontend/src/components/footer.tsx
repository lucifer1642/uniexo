'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { LegalModal } from './legal-modal';

export function Footer() {
  const [legalModal, setLegalModal] = useState<{ open: boolean, title: string, content: React.ReactNode }>({
    open: false,
    title: '',
    content: null
  });

  const openLegal = (title: string, content: React.ReactNode) => {
    setLegalModal({ open: true, title, content });
  };

  const privacyContent = (
    <div className="space-y-4">
      <p>At UniExo, your privacy is our priority. We collect minimal data to ensure a smooth rental experience.</p>
      <h4 className="font-bold text-white">Data Collection</h4>
      <p>We collect your email, name, and contact details for verification and booking purposes.</p>
      <h4 className="font-bold text-white">Security</h4>
      <p>All data is encrypted and stored securely on our protected servers.</p>
    </div>
  );

  const termsContent = (
    <div className="space-y-4">
      <p>By using UniExo, you agree to our community guidelines and rental policies.</p>
      <h4 className="font-bold text-white">Rentals</h4>
      <p>Users must provide valid ID for KYC verification before renting assets.</p>
      <h4 className="font-bold text-white">Payments</h4>
      <p>All transactions are processed through secure gateways. Platform fees may apply.</p>
    </div>
  );

  return (
    <footer className="bg-zinc-950 px-4 py-12 md:px-8 text-white w-full mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="text-2xl font-black tracking-tighter mb-4 inline-block text-primary">
            UNIEXO
          </Link>
          <p className="text-zinc-400 text-sm max-w-xs">
            The platform for renting vehicles, rooms, buying used items, and finding laundry services.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">Product</h3>
          <ul className="space-y-3">
            <li><Link href="/vehicles" className="text-zinc-400 hover:text-white transition-colors text-sm">Vehicles</Link></li>
            <li><Link href="/houses" className="text-zinc-400 hover:text-white transition-colors text-sm">Rooms</Link></li>
            <li><Link href="/marketplace" className="text-zinc-400 hover:text-white transition-colors text-sm">Used Items</Link></li>
            <li><Link href="/laundry" className="text-zinc-400 hover:text-white transition-colors text-sm">Laundry</Link></li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">Company</h3>
          <ul className="space-y-3">
            <li><Link href="/about" className="text-zinc-400 hover:text-white transition-colors text-sm">About Us</Link></li>
            <li>
              <button onClick={() => openLegal('Privacy Policy', privacyContent)} className="text-zinc-400 hover:text-white transition-colors text-sm text-left">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => openLegal('Terms of Service', termsContent)} className="text-zinc-400 hover:text-white transition-colors text-sm text-left">
                Terms of Service
              </button>
            </li>
          </ul>
        </div>

        {/* Resources Links */}
        <div>
          <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">Resources</h3>
          <ul className="space-y-3">
            <li><Link href="/faqs" className="text-zinc-400 hover:text-white transition-colors text-sm">FAQs</Link></li>
            <li><Link href="/help" className="text-zinc-400 hover:text-white transition-colors text-sm">Help Center</Link></li>
          </ul>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">Social Links</h3>
          <ul className="space-y-3">
            <li>
              <Link href="https://facebook.com" className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
                <Facebook className="h-4 w-4 mr-2 group-hover:text-blue-500" />
                Facebook
              </Link>
            </li>
            <li>
              <Link href="https://instagram.com" className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
                <Instagram className="h-4 w-4 mr-2 group-hover:text-pink-500" />
                Instagram
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto mt-12 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Uniexo Platform. All rights reserved.</p>
      </div>

      <LegalModal 
        isOpen={legalModal.open} 
        onClose={() => setLegalModal({ ...legalModal, open: false })} 
        title={legalModal.title}
        content={legalModal.content}
      />
    </footer>
  );
}
