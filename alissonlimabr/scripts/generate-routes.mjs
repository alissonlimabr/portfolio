#!/usr/bin/env node
// Generates every route that needs static HTML during the Vercel build.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '..', 'routes.txt');

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = process.env.SANITY_API_VERSION || '2025-05-20';

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

const routes = new Set([
  '/',
  '/blog',
  '/blog/categorias',
  ...posts.map(slug => `/blog/${slug}`),
  ...categories.map(slug => `/blog/categoria/${slug}`),
]);

writeFileSync(target, `${Array.from(routes).join('\n')}\n`, 'utf8');
console.log(`[generate-routes] routes.txt generated with ${routes.size} routes.`);
