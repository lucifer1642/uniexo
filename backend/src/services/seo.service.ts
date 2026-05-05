import { supabase } from '../config/supabase';
import { env } from '../config/env';

/**
 * SEOService for Sitemap and Metadata Generation
 */
export class SEOService {
  
  static async generateSitemap(): Promise<string> {
    const baseUrl = env.CLIENT_URL || 'https://uniexo.in';
    
    // Fetch all listings for sitemap
    const [houses, vehicles, marketplace] = await Promise.all([
      supabase.from('houses').select('slug, updated_at').eq('is_deleted', false).eq('approval_status', 'approved'),
      supabase.from('vehicles').select('slug, updated_at').eq('is_deleted', false).eq('approval_status', 'approved'),
      supabase.from('marketplace_items').select('slug, updated_at').eq('is_deleted', false).eq('approval_status', 'approved')
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = ['', '/houses', '/vehicles', '/marketplace', '/laundry', '/login', '/signup'];
    staticPages.forEach(page => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // House listings
    (houses.data || []).forEach(item => {
      xml += `  <url>\n    <loc>${baseUrl}/houses/${item.slug}</loc>\n    <lastmod>${new Date(item.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Vehicle listings
    (vehicles.data || []).forEach(item => {
      xml += `  <url>\n    <loc>${baseUrl}/vehicles/${item.slug}</loc>\n    <lastmod>${new Date(item.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Marketplace items
    (marketplace.data || []).forEach(item => {
      xml += `  <url>\n    <loc>${baseUrl}/marketplace/${item.slug}</loc>\n    <lastmod>${new Date(item.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
  }

  /**
   * Generate JSON-LD Structured Data for a House Listing
   */
  static generateHouseSchema(house: any) {
    return {
      "@context": "https://schema.org",
      "@type": "Accommodation",
      "name": house.name,
      "description": house.description,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": house.city,
        "addressRegion": house.state,
        "postalCode": house.pincode,
        "streetAddress": house.address
      },
      "image": house.images?.[0] || "",
      "priceRange": `INR ${house.pricePerMonth || house.singleSharingPrice}`
    };
  }
}
