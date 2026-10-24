// sitemap.xml, built from the same data that builds the pages. lastmod is the build date.
import type { APIRoute } from 'astro';
import { site } from '../data/site.config.mjs';
import { SERVICES } from '../data/services';
import { LAB } from '../data/lab';

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const pages: [string, string][] = [
    ['/', 'weekly'],
    ...SERVICES.map((s) => [s.href, 'monthly'] as [string, string]),
    ['/lab/', 'monthly'],
    ...LAB.map((x) => [`/lab/${x.slug}/`, 'yearly'] as [string, string]),
    ['/start/', 'yearly'],
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(([p, freq]) => `  <url><loc>${new URL(p, site.url).href}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
