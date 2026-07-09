# alissonlimabr

## Stack

- Angular `21.2.x`
- Angular Material
- SSR + prerender
- Blog integrado ao Sanity CMS

## Rodar localmente

```bash
cd alissonlimabr
npm ci
npx ng serve
```

App em `http://localhost:4200`.

## Angular CLI

- `ng serve`: servidor de desenvolvimento
- `ng build`: build de produção
- `ng build --watch --configuration development`: build em watch (development)
- `ng test`: testes unitários (Karma)
- `ng run alissonlimabr:server:production`: build SSR server (produção)

Se não tiver Angular CLI global, use `npx`:

- `npx ng serve`
- `npx ng build`
- `npx ng test`

## Scripts utilitários do projeto

- `npm run start`: atalho para `ng serve`
- `npm run build`: atalho para `ng build`
- `npm run watch`: atalho para `ng build --watch --configuration development`
- `npm run test`: atalho para `ng test`
- `npm run prerender`: gera rotas dinâmicas e prerenderiza HTML estático

## Ambiente (Sanity)

Copie `src/environments/environment.example.ts` para:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Ou gere automaticamente:

```bash
node scripts/generate-env.mjs
```

Variáveis esperadas:

- `SANITY_PROJECT_ID` (obrigatória)
- `SANITY_DATASET` (default: `production`)
- `SANITY_API_VERSION` (default: `2025-05-20`)
