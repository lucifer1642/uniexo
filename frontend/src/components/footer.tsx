'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, ChevronDown } from 'lucide-react';
import { LegalModal } from './legal-modal';
import { motion, AnimatePresence } from 'framer-motion';

export function Footer() {
  const [legalModal, setLegalModal] = useState<{ open: boolean, title: string, content: React.ReactNode }>({
    open: false,
    title: '',
    content: null
  });
  const [openSection, setOpenSection] = useState<string | null>(null);

  const openLegal = (title: string, content: React.ReactNode) => {
    setLegalModal({ open: true, title, content });
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
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

  const sections = [
    {
      id: 'product',
      title: 'Product',
      links: [
        { href: '/vehicles', label: 'Vehicles' },
        { href: '/houses', label: 'Rooms' },
        { href: '/marketplace', label: 'Used Items' },
        { href: '/laundry', label: 'Laundry' },
      ]
    },
    {
      id: 'company',
      title: 'Company',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '#privacy', label: 'Privacy Policy', onClick: () => openLegal('Privacy Policy', privacyContent) },
        { href: '#terms', label: 'Terms of Service', onClick: () => openLegal('Terms of Service', termsContent) },
      ]
    },
    {
      id: 'resources',
      title: 'Resources',
      links: [
        { href: '/faqs', label: 'FAQs' },
        { href: '/help', label: 'Help Center' },
      ]
    }
  ];

  return (
    <footer className="bg-zinc-950 px-4 py-8 md:py-12 md:px-8 text-white w-full mt-auto has-bottom-nav md:pb-12">
      {/* Desktop: Full grid */}
      <div className="container mx-auto hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-1">
          <Link href="/" className="text-2xl font-black tracking-tighter mb-4 inline-block text-primary">
            UNIEXO
          </Link>
          <p className="text-zinc-400 text-sm max-w-xs">
            The platform for renting vehicles, rooms, buying used items, and finding laundry services.
          </p>
        </div>

        {sections.map(section => (
          <div key={section.id}>
            <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">{section.title}</h3>
            <ul className="space-y-3">
              {section.links.map(link => (
                <li key={link.label}>
                  {(link as any).onClick ? (
                    <button onClick={(link as any).onClick} className="text-zinc-400 hover:text-white transition-colors text-sm text-left">
                      {link.label}
                    </button>
                  ) : (
                    <Link href={link.href} className="text-zinc-400 hover:text-white transition-colors text-sm">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="font-bold text-zinc-100 mb-4 text-xs uppercase tracking-widest">Social</h3>
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

      {/* Mobile: Accordion layout */}
      <div className="md:hidden space-y-0">
        <Link href="/" className="text-xl font-black tracking-tighter mb-4 inline-block text-primary">
          UNIEXO
        </Link>
        <p className="text-zinc-500 text-xs mb-6 max-w-[280px]">
          Rent vehicles, rooms, buy used items, and find laundry services.
        </p>

        {sections.map(section => (
          <div key={section.id} className="border-t border-zinc-800/50">
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full py-3.5 text-left tap-feedback"
            >
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{section.title}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${openSection === section.id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 space-y-2.5 pl-1">
                    {section.links.map(link => (
                      <div key={link.label}>
                        {(link as any).onClick ? (
                          <button onClick={(link as any).onClick} className="text-zinc-500 text-sm tap-feedback">
                            {link.label}
                          </button>
                        ) : (
                          <Link href={link.href} className="text-zinc-500 text-sm block tap-feedback">{link.label}</Link>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Social links - horizontal on mobile */}
        <div className="border-t border-zinc-800/50 pt-4 flex items-center gap-4">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Follow</span>
          <Link href="https://facebook.com" className="p-2 rounded-xl bg-white/[0.03] border border-white/5 tap-feedback">
            <Facebook className="h-4 w-4 text-zinc-400" />
          </Link>
          <Link href="https://instagram.com" className="p-2 rounded-xl bg-white/[0.03] border border-white/5 tap-feedback">
            <Instagram className="h-4 w-4 text-zinc-400" />
          </Link>
        </div>
      </div>
      
      <div className="container mx-auto mt-6 md:mt-12 pt-6 md:pt-8 border-t border-zinc-800 text-center text-xs md:text-sm text-zinc-500">
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
