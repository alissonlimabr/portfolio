#!/usr/bin/env node
// Generates every route that needs static HTML during the Vercel build.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const routesTarget = resolve(__dirname, '..', 'routes.txt');
const sitemapTarget = resolve(__dirname, '..', 'src', 'sitemap.xml');

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = process.env.SANITY_API_VERSION || '2025-05-20';
const RAW_SITE_URL = (
  process.env.SITE_URL || 'https://www.alissonlimadev.com'
).replace(/\/$/, '');

let SITE_URL;
try {
  const parsed = new URL(RAW_SITE_URL);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`invalid protocol: ${parsed.protocol}`);
  }
  SITE_URL = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(
    /\/$/,
    '',
  )}`;
} catch (err) {
  console.error(`[generate-routes] Invalid SITE_URL (${RAW_SITE_URL}): ${err.message}`);
  process.exit(1);
}

if (!PROJECT_ID) {
  console.error('[generate-routes] SANITY_PROJECT_ID is required to prerender blog routes.');
  process.exit(1);
}

const safeConfigValue = /^[A-Za-z0-9_.-]+$/;
for (const [key, value] of Object.entries({ PROJECT_ID, DATASET, API_VERSION })) {
  if (!safeConfigValue.test(value)) {
    console.error(`[generate-routes] Invalid value for ${key}: "${value}"`);
    process.exit(1);
  }
}

const groq = `{
  "posts": *[_type == "post" && defined(slug.current)].slug.current,
  "categories": *[_type == "category" && defined(slug.current)].slug.current
}`;
const queryUrl = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;

let content;
try {
  const response = await fetch(queryUrl, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  content = (await response.json()).result || {};
} catch (err) {
  console.error(`[generate-routes] Failed to query Sanity: ${err.message}`);
  process.exit(1);
}

const validateSlugs = (slugs, type) =>
  (slugs || []).map(slug => {
    if (typeof slug !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug)) {
      throw new Error(`Invalid ${type} slug returned by Sanity: "${slug}"`);
    }
    return slug;
  });

let posts;
let categories;
try {
  posts = validateSlugs(content.posts, 'post').sort();
  categories = validateSlugs(content.categories, 'category').sort();
} catch (err) {
  console.error(`[generate-routes] ${err.message}`);
  process.exit(1);
}

const prerenderRoutes = new Set([
  '/',
  '/404',
  '/blog',
  '/blog/categorias',
  ...posts.map(slug => `/blog/${slug}`),
  ...categories.map(slug => `/blog/categoria/${slug}`),
]);

const sortedPrerenderRoutes = Array.from(prerenderRoutes).sort((a, b) =>
  a.localeCompare(b),
);
writeFileSync(routesTarget, `${sortedPrerenderRoutes.join('\n')}\n`, 'utf8');

const escapeXml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toAbsoluteUrl = (route) =>
  route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;

const getSitemapHints = (route) => {
  if (route === '/') return { changefreq: 'weekly', priority: '1.0' };
  if (route === '/blog') return { changefreq: 'daily', priority: '0.9' };
  if (route === '/blog/categorias') {
    return { changefreq: 'daily', priority: '0.8' };
  }
  if (route.startsWith('/blog/categoria/')) {
    return { changefreq: 'daily', priority: '0.8' };
  }
  if (route.startsWith('/blog/')) return { changefreq: 'weekly', priority: '0.7' };
  return { changefreq: 'monthly', priority: '0.6' };
};

const sitemapRoutes = sortedPrerenderRoutes.filter(route => route !== '/404');

const sitemapEntries = sitemapRoutes
  .map((route) => {
    const { changefreq, priority } = getSitemapHints(route);
    return `  <url>
    <loc>${escapeXml(toAbsoluteUrl(route))}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;

writeFileSync(sitemapTarget, sitemap, 'utf8');
console.log(
  `[generate-routes] routes.txt generated with ${prerenderRoutes.size} routes.`,
);
console.log(
  `[generate-routes] sitemap.xml generated with ${sitemapRoutes.length} URLs.`,
);
