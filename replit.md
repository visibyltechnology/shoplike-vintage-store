# Shoplike Vintage Store

A Nigeria-based vintage clothing e-commerce store (Men, Women, Children) powered by PostgreSQL, Express 5, and React/Vite.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, mapped to `/api`)
- `pnpm --filter @workspace/store run dev` — run the storefront (port 24964, mapped to `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Default Credentials

- **Admin login** → `/admin` — password: `shoplike2024`
- **Customer accounts** → `/signup` to register

## Environment Variables

All Supabase variables are stored as Replit Secrets:

| Variable | Scope | Purpose |
|---|---|---|
| `SUPABASE_URL` | Server | Supabase project REST API URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Supabase anon/publishable key |
| `VITE_SUPABASE_URL` | Frontend (Vite) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend (Vite) | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Frontend (Vite) | Supabase project ID |
| `SESSION_SECRET` | Server | JWT signing secret |
| `ADMIN_PASSWORD` | Server | Admin login password (fallback if not set in DB settings) |

Supabase project URL: `https://afdgjlkivfhwqhjoaylg.supabase.co`

GitHub repo: `https://github.com/visibyltechnology/shoplike-vintage-store`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS, shadcn/ui, Wouter routing
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM (Replit-managed)
- Auth: bcryptjs + JWT (customer & admin)
- Payments: Korapay (configured via admin settings page)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

| Path | Purpose |
|---|---|
| `lib/api-spec/openapi.yaml` | Single source of truth for all API contracts |
| `lib/db/src/schema/` | Drizzle ORM table definitions (products, categories, orders, customers, settings) |
| `lib/api-zod/src/generated/` | Auto-generated Zod validation schemas |
| `lib/api-client-react/src/generated/` | Auto-generated React Query hooks |
| `artifacts/api-server/src/routes/` | Express route handlers (one file per domain) |
| `artifacts/store/src/pages/` | All storefront + admin pages |
| `artifacts/store/src/context/` | Cart & Wishlist context providers |
| `artifacts/store/src/lib/api.ts` | Auth token helpers (admin + customer JWT) |
| `artifacts/store/public/logo.jpg` | Store logo |

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Never hand-write types for API data.
- Admin auth is password-only (JWT, 7-day expiry). Password stored as bcrypt hash in settings table. Default: `shoplike2024`.
- Customer auth uses email+password JWT (30-day expiry), stored in localStorage.
- All file uploads are stored locally under `artifacts/api-server/uploads/` and served at `/api/uploads/:filename`. For production, migrate to object storage.
- Korapay payment keys are stored in the `settings` table and configurable from the admin Settings page.
- Prices are stored as `NUMERIC(12,2)` in Postgres and converted to `number` in API responses.

## Product

- **Homepage**: Hero carousel, top categories sidebar, Men/Women/Children sections, WhatsApp CTA
- **Shop**: Browse by section (Male/Female/Children), filter by category, search, sale filter
- **Product page**: Image gallery, video support, size/color selection, add-to-cart, WhatsApp enquiry
- **Cart**: Full cart management with quantity controls
- **Checkout**: Shipping address form, Korapay payment or pay-on-delivery
- **Order tracking**: Track by order reference number
- **Customer accounts**: Signup/login, order history
- **Wishlist**: Save products for later
- **Admin panel** (`/admin`): Dashboard with stats/charts, product management, order management, category management, settings (Korapay keys, WhatsApp, banner)

## User preferences

- WhatsApp: 09063172596
- Currency: NGN (₦)
- Sections: male, female, children

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run codegen before touching route or frontend code.
- DB schema changes: edit `lib/db/src/schema/`, then `pnpm run typecheck:libs`, then `pnpm --filter @workspace/db run push`.
- Admin password: stored as bcrypt hash in the `settings` table. If the table is empty, falls back to `ADMIN_PASSWORD` env var or `shoplike2024`.
- Upload files are stored locally — not persistent across deploys. Move to object storage before production launch.
- Korapay requires the store URL to be set in `STORE_URL` env var for redirect after payment.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/index.ts`
