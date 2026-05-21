#!/usr/bin/env node
// Gera src/rss.xml a partir dos posts do Sanity.
// Executado pelo Vercel antes do build (vercel.json -> buildCommand).
//
// Variáveis utilizadas:
//   SANITY_PROJECT_ID         (obrigatória; se ausente, escreve placeholder)
//   SANITY_DATASET            (default: production)
//   SANITY_API_VERSION        (default: 2025-05-20)
//   SITE_URL                  (default: https://alissonlimadev.com)
//   RSS_TITLE / RSS_DESCRIPTION / RSS_AUTHOR (opcionais)

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '..', 'src', 'rss.xml');

const RAW_SITE_URL = (process.env.SITE_URL || 'https://alissonlimadev.com').replace(/\/$/, '');
let SITE_URL;
try {
  const parsed = new URL(RAW_SITE_URL);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`protocolo não permitido: ${parsed.protocol}`);
  }
  SITE_URL = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`;
} catch (err) {
  console.error(`[generate-rss] SITE_URL inválido (${RAW_SITE_URL}): ${err.message}`);
  process.exit(1);
}

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const API_VERSION = process.env.SANITY_API_VERSION || '2025-05-20';
const AUTHOR = process.env.RSS_AUTHOR || 'Alisson Lima';
const TITLE = process.env.RSS_TITLE || 'Alisson Lima Dev — Blog';
const DESCRIPTION =
  process.env.RSS_DESCRIPTION ||
  'Artigos sobre desenvolvimento, tecnologia e carreira.';

const escape = str =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const writePlaceholder = reason => {
  const placeholder = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>Feed indisponível: ${escape(reason)}</description>
  </channel>
</rss>
`;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, placeholder, 'utf8');
};

if (!PROJECT_ID) {
  console.warn('[generate-rss] SANITY_PROJECT_ID ausente; gerando placeholder.');
  writePlaceholder('configuração ausente');
  process.exit(0);
}

const safe = /^[A-Za-z0-9_.-]+$/;
for (const [key, value] of Object.entries({ PROJECT_ID, DATASET, API_VERSION })) {
  if (!safe.test(value)) {
    console.error(`[generate-rss] Valor inválido para ${key}: "${value}"`);
    writePlaceholder('configuração inválida');
    process.exit(0);
  }
}

const groq = `*[_type == "post"] | order(publishedAt desc) [0...50] {
  _id, title, slug, excerpt, publishedAt,
  "categories": categories[]->title
}`;

const queryUrl = `https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(groq)}`;

let posts = [];
try {
  const response = await fetch(queryUrl, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  posts = json.result || [];
} catch (err) {
  console.error(`[generate-rss] Falha ao consultar Sanity: ${err.message}`);
  writePlaceholder('erro na consulta');
  process.exit(0);
}

const items = posts
  .map(p => {
    const link = `${SITE_URL}/blog/${p.slug.current}`;
    const pubDate = new Date(p.publishedAt).toUTCString();
    const cats = (p.categories || [])
      .map(c => `      <category>${escape(c)}</category>`)
      .join('\n');
    return `    <item>
      <title>${escape(p.title)}</title>
      <link>${link}</link>
      <description>${escape(p.excerpt || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>${cats ? '\n' + cats : ''}
    </item>`;
  })
  .join('\n');

const now = new Date().toUTCString();
const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escape(DESCRIPTION)}</description>
    <language>pt-br</language>
    <lastBuildDate>${now}</lastBuildDate>
    <managingEditor>noreply@alissonlimadev.com (${escape(AUTHOR)})</managingEditor>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, rss, 'utf8');
console.log(`[generate-rss] rss.xml gerado com ${posts.length} posts.`);
