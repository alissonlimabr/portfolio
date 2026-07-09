#!/usr/bin/env node
// Gera src/environments/environment.prod.ts a partir de variáveis do ambiente.
// Executado pelo Vercel antes do build (vercel.json -> buildCommand).
//
// Variáveis obrigatórias:
//   SANITY_PROJECT_ID
//   SANITY_DATASET           (default: production)
//   SANITY_API_VERSION       (default: 2025-05-20)

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envDir = resolve(__dirname, '..', 'src', 'environments');
const targetProd = resolve(envDir, 'environment.prod.ts');
const targetDev = resolve(envDir, 'environment.ts');

const required = ['SANITY_PROJECT_ID'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n[generate-env] Variáveis ausentes: ${missing.join(', ')}`);
  console.error('Configure-as em Vercel → Settings → Environment Variables.\n');
  process.exit(1);
}

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2025-05-20';

// Validação básica para evitar injeção via env var maliciosa
const safe = /^[A-Za-z0-9_.-]+$/;
for (const [key, value] of Object.entries({ projectId, dataset, apiVersion })) {
  if (!safe.test(value)) {
    console.error(`[generate-env] Valor inválido para ${key}: "${value}"`);
    process.exit(1);
  }
}

const content = `// Arquivo gerado automaticamente por scripts/generate-env.mjs — NÃO EDITE.
export const environment = {
  production: true,
  sanity: {
    projectId: '${projectId}',
    dataset: '${dataset}',
    apiVersion: '${apiVersion}',
    useCdn: true,
  },
};
`;

mkdirSync(envDir, { recursive: true });
writeFileSync(targetDev, content, 'utf8');
writeFileSync(targetProd, content, 'utf8');
console.log(`[generate-env] environment.ts e environment.prod.ts gerados (projectId: ${projectId}, dataset: ${dataset}).`);
