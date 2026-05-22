'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, ChevronDown } from 'lucide-react';
import { LegalModal } from './legal-modal';
import { motion, AnimatePresence } from 'framer-motion';
import { UniExoBrand } from './brand';

export function Footer() {
  const [legalModal, setLegalModal] = useState<{ open: boolean, title: string, content: React.ReactNode }>({
    open: false,
    title: '',
    content: null
  });
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();

  const isHiddenRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/admin') || pathname.startsWith('/dashboard');

  if (isHiddenRoute) return null;

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
    <footer className="relative overflow-hidden w-full mt-auto has-bottom-nav md:pb-0 theme-landing" style={{ background: 'linear-gradient(170deg, #0D1B2A 0%, #111827 60%, #0D1B2A 100%)' }}>
      
      {/* ── Decorative Background Elements ── */}
      {/* Gold glow orb top-left */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
      {/* Gold glow orb bottom-right */}
      <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />
      {/* Navy secondary glow center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #C9A84C 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gold shimmer top border */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="relative z-10 px-4 py-10 md:py-14 md:px-8">

        {/* Desktop: Full grid */}
        <div className="container mx-auto hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="mb-5 inline-block">
              <UniExoBrand size="lg" />
            </Link>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              The platform for renting vehicles, rooms, buying used items, and finding laundry services.
            </p>
            {/* Animated gold accent bar */}
            <div className="mt-5 w-12 h-1 rounded-full bg-gradient-to-r from-accent to-accent/30 animate-pulse" />
          </div>

          {sections.map(section => (
            <div key={section.id}>
              <h3 className="font-bold text-accent/80 mb-4 text-[10px] uppercase tracking-[0.2em]">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map(link => (
                  <li key={link.label}>
                    {(link as any).onClick ? (
                      <button onClick={(link as any).onClick} className="text-white/50 hover:text-accent transition-colors text-sm text-left">
                        {link.label}
                      </button>
                    ) : (
                      <Link href={link.href} className="text-white/50 hover:text-accent transition-colors text-sm">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-bold text-accent/80 mb-4 text-[10px] uppercase tracking-[0.2em]">Social</h3>
            <ul className="space-y-3">
              <li>
                <Link href="https://facebook.com" className="group flex items-center text-white/50 hover:text-accent transition-colors text-sm gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent/40 group-hover:bg-accent/10 transition-all">
                    <Facebook className="h-3.5 w-3.5" />
                  </div>
                  Facebook
                </Link>
              </li>
              <li>
                <Link href="https://instagram.com" className="group flex items-center text-white/50 hover:text-accent transition-colors text-sm gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-accent/40 group-hover:bg-accent/10 transition-all">
                    <Instagram className="h-3.5 w-3.5" />
                  </div>
                  Instagram
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile: Accordion layout */}
        <div className="md:hidden space-y-0">
          <Link href="/" className="mb-4 inline-block">
            <UniExoBrand size="md" />
          </Link>
          <p className="text-white/50 text-xs mb-6 max-w-[280px]">
            Rent vehicles, rooms, buy used items, and find laundry services.
          </p>

          {sections.map(section => (
            <div key={section.id} className="border-t border-white/10">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full py-3.5 text-left tap-feedback"
              >
                <span className="text-[10px] font-bold text-accent/70 uppercase tracking-[0.2em]">{section.title}</span>
                <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-200 ${openSection === section.id ? 'rotate-180' : ''}`} />
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
                            <button onClick={(link as any).onClick} className="text-white/50 hover:text-accent text-sm tap-feedback transition-colors">
                              {link.label}
                            </button>
                          ) : (
                            <Link href={link.href} className="text-white/50 hover:text-accent text-sm block tap-feedback transition-colors">{link.label}</Link>
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
          <div className="border-t border-white/10 pt-4 flex items-center gap-3">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Follow</span>
            <Link href="https://facebook.com" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-accent/10 transition-all tap-feedback">
              <Facebook className="h-4 w-4 text-white/50" />
            </Link>
            <Link href="https://instagram.com" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-accent/40 hover:bg-accent/10 transition-all tap-feedback">
              <Instagram className="h-4 w-4 text-white/50" />
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="container mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Uniexo Platform. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_6px_rgba(201,168,76,0.6)]" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Powered by UniExo</span>
          </div>
        </div>
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
