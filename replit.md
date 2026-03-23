# SocialShop — Multi-Merchant Social Commerce Platform

## Overview

SocialShop is a multi-merchant social commerce platform where merchants selling on Instagram, Facebook, and TikTok can aggregate their presence. Shoppers browse a global feed, add items from multiple merchants to a shared cart, and checkout with GPS/address delivery.

pnpm workspace monorepo using TypeScript. Two running services: a React/Vite frontend and an Express API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Auth**: Replit OIDC (openid-client, session-based)
- **Data fetching**: React Query + generated hooks from OpenAPI

## Design

- Warm off-white background (HSL 36 20% 98%), primary color = warm orange-red
- Platform colors: Instagram=#E1306C, Facebook=#1877F2, TikTok=#000
- Mobile-first, 428px max container, original identity (NOT an Instagram clone)
- Font display: custom warm branded look

## Structure

```text
artifacts/
├── api-server/         # Express API server (port 8080)
└── insta-store/        # React/Vite frontend (port from $PORT)
lib/
├── api-spec/           # OpenAPI spec + Orval codegen config
├── api-client-react/   # Generated React Query hooks
├── api-zod/            # Generated Zod schemas from OpenAPI
└── db/                 # Drizzle ORM schema + DB connection
scripts/
└── src/seed-store.ts   # Multi-merchant seed script
```

## Database Schema

Tables: `users`, `sessions`, `merchants`, `products`, `highlights`, `cart_items`, `orders`, `order_items`

- **users** — Replit OIDC user records (id is string from OIDC `sub`)
- **sessions** — server-side session storage (replaces cookies for auth state)
- **merchants** — store profiles linked to users; includes socialLinks JSONB, avatar, coverImage, stats
- **products** — FK to merchants; platform field (instagram/facebook/tiktok), images[], tags[]
- **highlights** — merchant collections/story highlights with coverImage
- **cart_items** — userId + productId + merchantId + quantity
- **orders** — userId, status, address, customerName, notes, total, lat/lng
- **order_items** — denormalized: orderId + productId + merchantId + title + price + image

Push schema: `pnpm --filter @workspace/db run push`
Seed: `pnpm --filter @workspace/scripts run seed-store`
Seeded merchants: Luxe Boutique (@luxe.boutique), Nomad Gear Co. (@nomad.gear), Verde Living (@verde.living)

## Auth

- Replit OIDC via `openid-client`
- Routes: `GET /api/login` → OIDC redirect, `GET /api/callback` → session create, `GET /api/logout`
- Session stored server-side (sessions table), sid in cookie `session_id`
- `GET /api/auth/user` returns `{ isAuthenticated: bool, user?: { id, email, firstName, lastName, profileImageUrl } }`
- Nullable DB fields sanitized to `undefined` before Zod parse in auth route
- Frontend: `artifacts/insta-store/src/lib/auth.tsx` — custom AuthContext, not using `@workspace/replit-auth-web`

## API Routes

### Public
- `GET /api/feed` — global product feed (all merchants), filterable by platform/category
- `GET /api/merchants` — list all merchants
- `GET /api/merchants/:username` — merchant profile
- `GET /api/merchants/:username/products` — merchant's products
- `GET /api/merchants/:username/highlights` — merchant's collections
- `GET /api/products/:id` — single product detail
- `GET /api/auth/user` — current auth state
- `GET /api/login`, `GET /api/callback`, `GET /api/logout` — auth flow

### Social (likes/comments)
- `POST /api/products/:id/like` — toggle like on a product (authenticated); returns `{ liked, likeCount }`
- `GET /api/products/:id/comments` — list comments for a product (public)
- `POST /api/products/:id/comments` — add a comment (authenticated); returns new comment object

### Authenticated (requires session)
- `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/:itemId`, `DELETE /api/cart/:itemId`, `DELETE /api/cart`
- `POST /api/orders` — checkout (creates order from cart, clears cart)
- `GET /api/orders` — user's order history

### Merchant (requires session + merchant profile)
- `GET /api/merchant/me` — own merchant profile
- `POST /api/merchant/register` — register as merchant
- `GET /api/merchant/products` — own products
- `DELETE /api/merchant/products/:id` — delete product
- `GET /api/merchant/orders` — orders containing own products
- `PATCH /api/merchant/orders/:id/status` — update order status

## Frontend Pages

- `/` — FeedPage: global feed with merchant strips, platform filter tabs (All/IG/FB/TT), ProductDetailSheet
- `/cart` — CartPage: merchant-grouped cart, quantity controls, checkout CTA
- `/checkout` — CheckoutPage: GPS location + manual address, customer name/notes, order placement
- `/dashboard` — DashboardPage: merchant registration form OR overview/orders/products tabs
- `/profile` — ProfilePage: order history, sign out, link to dashboard
- `/store/:username` — MerchantStorePage: individual merchant store with collections, platform filter, grid/feed toggle

## Key Components

- `ProductDetailSheet` — bottom drawer with image carousel, like/save/share, Add to Cart (with query invalidation)
- `ProductGrid` / `ProductFeed` — product layout modes
- `MobileContainer` — 428px centered layout wrapper
- `BottomNav` — tab bar with Home/Explore/Cart/Profile
- `useAuth()` — auth context hook with `isAuthenticated`, `user`, `login()`, `logout()`

## Known Patterns

- After `addToCart`, `queryClient.invalidateQueries({ queryKey: ["/api/cart"] })` is called to bust cache
- `useGetCart` uses `refetchOnMount: "always"` in CartPage
- Nullable DB fields use `?? undefined` before Zod `.optional()` fields (`.optional()` rejects `null`)
- `storeProfilesTable` is aliased to `merchantsTable` in schema for backwards compat

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — no JS from tsc, bundling via esbuild/vite
- Run codegen: `pnpm --filter @workspace/api-spec run codegen`
