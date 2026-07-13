#!/usr/bin/env node
// Renders static route HTML without the legacy Angular prerender worker.

import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const routesPath = join(root, 'routes.txt');
const browserPath = join(root, 'dist', 'alissonlimabr', 'browser');
const serverBundlePath = join(root, 'dist', 'alissonlimabr', 'server', 'main.js');

const require = createRequire(import.meta.url);
const serverExports = require(serverBundlePath);
const { AppServerModule, renderModule, ɵSERVER_CONTEXT: SERVER_CONTEXT } = serverExports;

if (!AppServerModule || typeof renderModule !== 'function' || !SERVER_CONTEXT) {
  console.error('[prerender] The server bundle does not export AppServerModule and Angular renderModule.');
  process.exit(1);
}

const [document, routeText] = await Promise.all([
  readFile(join(browserPath, 'index.html'), 'utf8'),
  readFile(routesPath, 'utf8'),
]);

const routes = routeText
  .split(/\r?\n/)
  .map(route => route.trim())
  .filter(Boolean);

const routePattern = /^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?$/;
for (const route of routes) {
  if (!routePattern.test(route)) {
    console.error(`[prerender] Invalid route in routes.txt: "${route}"`);
    process.exit(1);
  }
}

for (const route of routes) {
  try {
    const html = await renderModule(AppServerModule, {
      document,
      url: route,
      extraProviders: [
        { provide: SERVER_CONTEXT, useValue: 'ssg' },
      ],
    });
    const destination = route === '/'
      ? join(browserPath, 'index.html')
      : join(browserPath, route.slice(1), 'index.html');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, html, 'utf8');
    if (route === '/404') {
      await writeFile(join(browserPath, '404.html'), html, 'utf8');
    }
    console.log(`[prerender] rendered ${route}`);
  } catch (err) {
    console.error(`[prerender] Failed to render ${route}:`, err);
    process.exit(1);
  }
}

console.log(`[prerender] Static HTML generated for ${routes.length} routes.`);
