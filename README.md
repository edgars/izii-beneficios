# API Developer Portal (Next.js + OpenAPI)

Portal de documentação e sandbox para múltiplas APIs, baseado em specs OpenAPI (`/specs`) e pronto para deploy na Vercel.

## Requisitos

- Node.js 18+ (recomendado 20+)

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Adicionando specs

- Coloque arquivos `.yaml`, `.yml` ou `.json` em `specs/`
- O portal cria o catálogo dinamicamente e mostra as APIs no seletor do topo

## Try it out

As chamadas são executadas via proxy em `app/api/proxy/route.ts` para evitar CORS no browser.

## Revalidar specs remotas (opcional)

Defina `REVALIDATE_SECRET` e chame `POST /api/specs/revalidate` com header `x-revalidate-secret` e body `{ "apiId": "..." }`.
