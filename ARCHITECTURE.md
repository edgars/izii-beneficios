# API Product Portal — Estrutura do Projeto

```
├── app/
│   ├── layout.tsx                 # Root layout (dark, Elms Sans, ThemeProvider)
│   ├── page.tsx                   # Home vitrine (Hero + API selector)
│   ├── globals.css
│   ├── docs/
│   │   ├── layout.tsx             # Layout guias MDX (sidebar + prose)
│   │   └── [slug]/page.tsx        # Páginas estáticas ISR (getting-started, …)
│   ├── [apiId]/
│   │   ├── layout.tsx             # Pass-through do segmento API
│   │   ├── page.tsx               # Redirect → primeiro endpoint
│   │   └── [endpoint]/page.tsx    # Explorer 3 colunas
│   └── api/
│       ├── proxy/route.ts         # Proxy CORS do playground
│       └── specs/revalidate/route.ts
├── components/
│   ├── home/                      # Hero, grid, magnetic button, API selector
│   ├── explorer/                  # Sidebar animada (Framer Motion)
│   ├── mdx/                       # Componentes MDX customizados
│   ├── api-explorer-layout.tsx    # Layout 3 colunas (Linear/Stripe)
│   ├── api-console-playground.tsx # Try It Out + snippets + response
│   ├── api-endpoint-docs.tsx      # Documentação custom (substitui Swagger)
│   └── ui/                        # shadcn/ui
├── content/guides/                # MDX narrativo (ISR revalidate: 3600)
├── specs/                         # OpenAPI YAML/JSON
├── config/apis.ts                 # Registro estático + scan de /specs
├── lib/
│   ├── openapi/                   # Parse (@redocly), nav, operations
│   ├── mdx/guides.ts              # Loader de guias
│   └── code-snippets.ts           # cURL / JS / Python
└── vercel.json                    # Headers segurança + cache assets
```

## ISR

- `export const revalidate = 3600` em páginas de docs, API e endpoints
- Specs remotas: `fetch` com `next.tags` em `lib/openapi/load.ts`

## Fonte

**Elms Sans** via Google Fonts em `app/globals.css`.
