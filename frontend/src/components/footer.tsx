import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-zinc-950 px-4 py-12 md:px-8 text-white w-full mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="lg:col-span-1">
          <Link href="/" className="text-2xl font-bold tracking-tight mb-4 inline-block">
            UNIEXO
          </Link>
          <p className="text-zinc-400 text-sm max-w-xs">
            The platform for renting vehicles, rooms, buying used items, and finding laundry services.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <h3 className="font-semibold text-zinc-100 mb-4">Product</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/features" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/testimonials" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Testimonials
              </Link>
            </li>
            <li>
              <Link href="/integration" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Integration
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h3 className="font-semibold text-zinc-100 mb-4">Company</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/faqs" className="text-zinc-400 hover:text-white transition-colors text-sm">
                FAQs
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-zinc-400 hover:text-white transition-colors text-sm">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Terms of Services
              </Link>
            </li>
          </ul>
        </div>

        {/* Resources Links */}
        <div>
          <h3 className="font-semibold text-zinc-100 mb-4">Resources</h3>
          <ul className="space-y-3">
            <li>
              <Link href="/blog" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/changelog" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Changelog
              </Link>
            </li>
            <li>
              <Link href="/brand" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Brand
              </Link>
            </li>
            <li>
              <Link href="/help" className="text-zinc-400 hover:text-white transition-colors text-sm">
                Help
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="font-semibold text-zinc-100 mb-4">Social Links</h3>
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
            <li>
              <Link href="https://youtube.com" className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
                <Youtube className="h-4 w-4 mr-2 group-hover:text-red-500" />
                Youtube
              </Link>
            </li>
            <li>
              <Link href="https://linkedin.com" className="group flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
                <Linkedin className="h-4 w-4 mr-2 group-hover:text-blue-400" />
                LinkedIn
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto mt-12 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Uniexo Platform. All rights reserved.</p>
      </div>
    </footer>
  );
}
