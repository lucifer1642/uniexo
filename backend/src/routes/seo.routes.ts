import { Router } from 'express';
import { SEOService } from '../services/seo.service';

const router = Router();

/**
 * Public SEO Routes
 */

router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await SEOService.generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'https://uniexo.in';
  const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/api/v1/seo/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;
