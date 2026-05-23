# Shoplike Vintage Store

A full-featured Nigerian fashion e-commerce store — curated vintage & contemporary clothing for men, women, and children. Built with React + Vite, deployed on Vercel, with Supabase for authentication and product data, and Korapay for payments.

**Live URL:** https://shoplike-vintage-store.vercel.app  
**Admin Panel:** https://shoplike-vintage-store.vercel.app/admin

---

## Admin Access

| Field    | Value                          |
|----------|-------------------------------|
| Email    | Shoplikevintage@gmail.com     |
| Password | Timber@1010                   |
| URL      | /admin                        |

---

## Tech Stack

| Layer       | Technology                                |
|-------------|-------------------------------------------|
| Frontend    | React 18, TypeScript, Vite                |
| Styling     | Tailwind CSS, shadcn/ui components        |
| Routing     | Wouter (lightweight client-side router)   |
| State       | TanStack React Query v5                   |
| Auth        | Supabase Auth (email + password)          |
| Database    | Supabase PostgreSQL                       |
| Payments    | Korapay inline checkout                   |
| Deployment  | Vercel (auto-deploy from GitHub)          |
| Source      | GitHub — visibyltechnology/shoplike-vintage-store |

---

## Repository Structure

```
shoplike-vintage-store/
├── public/
│   ├── logo.jpg              # Round store logo (used in navbar & auth pages)
│   ├── banner.jpg            # Hero banner background image
│   ├── favicon.svg           # Browser tab icon
│   ├── manifest.json         # PWA manifest (name, theme colour, icons)
│   ├── sw.js                 # Service worker (offline caching)
│   ├── korapay-logo.svg      # Korapay payment logo
│   ├── opengraph.jpg         # Social media share image
│   └── robots.txt            # Search engine directives
│
├── src/
│   ├── App.tsx               # Root app — router, providers, PWA prompt
│   ├── main.tsx              # React DOM entry point
│   ├── index.css             # Global styles, Tailwind directives
│   │
│   ├── components/
│   │   ├── Layout.tsx        # Main storefront layout (navbar + footer)
│   │   ├── AdminLayout.tsx   # Admin panel sidebar layout
│   │   ├── ProductCard.tsx   # Reusable product card (image, price, cart button)
│   │   ├── PWAInstallPrompt.tsx  # "Install app" bottom banner
│   │   └── ui/               # shadcn/ui primitives (Button, Badge, Skeleton…)
│   │
│   ├── context/
│   │   ├── CartContext.tsx   # Shopping cart — add/remove/update quantities
│   │   └── WishlistContext.tsx # Saved wishlist items
│   │
│   ├── hooks/
│   │   └── use-toast.ts      # Toast notification hook
│   │
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client (uses VITE_SUPABASE_URL / ANON_KEY)
│   │   ├── use-products.ts   # Supabase product query hooks (useProducts, useFeaturedProducts, useProduct)
│   │   ├── api.ts            # Admin token storage helpers (localStorage)
│   │   ├── api-url.ts        # API base URL resolver
│   │   ├── utils.ts          # Shared utility functions
│   │   └── api-client/       # Auto-generated React Query hooks from OpenAPI spec
│   │
│   └── pages/
│       ├── HomePage.tsx      # Landing page (hero slider, category cards, featured products)
│       ├── ShopPage.tsx      # Product listing + filters (section, price, in-stock, on-sale)
│       ├── ProductPage.tsx   # Single product detail (images, sizes, colours, add to cart)
│       ├── CartPage.tsx      # Shopping cart with quantity controls
│       ├── CheckoutPage.tsx  # Checkout form + Korapay payment
│       ├── OrderSuccessPage.tsx  # Order confirmation + receipt
│       ├── TrackOrderPage.tsx    # Order tracking by reference
│       ├── WishlistPage.tsx      # Saved wishlist
│       ├── AccountPage.tsx       # Customer account (orders, profile)
│       ├── CustomerAuthPage.tsx  # Login / Sign up (Supabase auth)
│       ├── ForgotPasswordPage.tsx
│       ├── ResetPasswordPage.tsx
│       ├── not-found.tsx
│       └── admin/
│           ├── AdminLogin.tsx     # Admin sign-in (email + password, local check)
│           ├── Dashboard.tsx      # Sales charts, revenue, order stats
│           ├── Products.tsx       # Add / edit / delete products (with image upload)
│           ├── Orders.tsx         # View and manage all orders
│           ├── Categories.tsx     # Product category management
│           ├── Users.tsx          # Customer management (restrict / delete)
│           ├── Payments.tsx       # Payment records and Korapay logs
│           └── AdminSettings.tsx  # Store settings (Korapay keys, SMS key, branding)
│
├── index.html                # HTML shell (PWA meta, manifest link, SW registration)
├── vite.config.ts            # Vite build config
├── tailwind.config.ts        # Tailwind theme (gold accent #c9a96e)
├── tsconfig.json
└── package.json
```

---

## Environment Variables (Vercel)

| Variable               | Purpose                                  |
|------------------------|------------------------------------------|
| `VITE_SUPABASE_URL`    | Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key              |
| `VITE_API_BASE_URL`    | Express API base (optional, unused in prod) |

Set these in the Vercel dashboard → Project → Settings → Environment Variables.

---

## Supabase Database

**Project:** acmxbaswtisoklprfajo.supabase.co

### Tables

#### `products`
| Column         | Type      | Description                                |
|----------------|-----------|--------------------------------------------|
| id             | bigserial | Primary key                                |
| name           | text      | Product name                               |
| description    | text      | Full description                           |
| price          | numeric   | Selling price in Naira (₦)                 |
| compare_price  | numeric   | Original price (for discount display)      |
| section        | text      | `male` / `female` / `children`             |
| category       | text      | Subcategory (e.g. Shirts, Dresses)         |
| in_stock       | boolean   | Whether the product is available           |
| stock_qty      | integer   | Available units                            |
| sizes          | jsonb     | Array of sizes (e.g. ["S","M","L","XL"])   |
| colors         | jsonb     | Array of colours                           |
| is_featured    | boolean   | Shown in "Great Deals" section             |
| is_on_sale     | boolean   | Shown in sale filter                       |
| images         | jsonb     | Array of image URLs                        |
| video_url      | text      | Optional product video URL                 |
| created_at     | timestamptz | Auto-set on insert                       |

**Seeded:** 30 products — 10 men's, 10 women's, 10 children's

#### `user_profiles`
| Column        | Type    | Description                           |
|---------------|---------|---------------------------------------|
| id            | uuid    | Matches Supabase Auth user ID         |
| email         | text    | Customer email                        |
| name          | text    | Full name                             |
| phone         | text    | Phone number                          |
| is_restricted | boolean | Admin can restrict access             |
| orders_count  | integer | Number of orders placed               |
| created_at    | timestamptz | Registration timestamp           |

Populated automatically when a customer signs up.

### Row Level Security (RLS)
- **products** — public SELECT; authenticated INSERT/UPDATE/DELETE
- **user_profiles** — public SELECT; authenticated users can INSERT and UPDATE their own row

---

## Store Features

### Customer-Facing
| Feature               | Details                                                   |
|-----------------------|-----------------------------------------------------------|
| Hero banner           | 3-slide auto-rotating carousel with CTA buttons           |
| Category shortcuts    | Men / Women / Children cards with Unsplash photos         |
| Featured products     | "Great Deals" grid with countdown timer                   |
| Section collections   | Men's, Women's, Children's rows on homepage               |
| Shop page             | Filter by section, category, price range, in-stock, sale  |
| Product detail        | Gallery, size/colour selector, quantity, add to cart      |
| Cart                  | Persistent cart (localStorage), quantity controls         |
| Checkout              | Customer form + Korapay inline payment                    |
| Order success         | Confirmation page with order reference                    |
| Order tracking        | Track by reference number                                 |
| Wishlist              | Save items for later                                      |
| Customer auth         | Sign up / Login / Forgot password via Supabase Auth       |
| Account page          | View orders, update profile                               |
| WhatsApp CTA          | "Chat with us on WhatsApp" button → wa.me/2349063172596   |
| PWA                   | Installable on mobile home screen, offline shell caching  |
| Dark/light mode       | Theme toggle stored in localStorage                       |

### Admin Panel (`/admin`)
| Section       | Features                                                         |
|---------------|------------------------------------------------------------------|
| Dashboard     | Revenue charts (recharts), recent orders, top products           |
| Products      | Add/edit/delete products, image upload, video URL support        |
| Orders        | List all orders, update status, view order details               |
| Categories    | Create/manage product categories per section                     |
| Users         | View customers, restrict/unrestrict accounts, delete profiles    |
| Payments      | View Korapay payment logs and statuses                           |
| Settings      | Korapay public/secret keys, SMS API key, email key, store info   |

---

## Products (Seeded)

### Men's Collection (10 items)
1. Classic Navy Blazer — ₦18,500
2. White Oxford Shirt — ₦8,200
3. Slim Fit Chinos — ₦12,000
4. Ankara Print Shirt — ₦11,000
5. Men's Formal Suit — ₦35,000
6. Polo T-Shirt 3-Pack — ₦7,500
7. Denim Jacket — ₦15,000
8. Senator Native Set — ₦22,000
9. Casual Linen Shirt — ₦9,800
10. Jogger Tracksuit Set — ₦13,500

### Women's Collection (10 items)
1. Floral Midi Dress — ₦14,500
2. Ankara Wrap Skirt — ₦9,000
3. Ladies Blazer Set — ₦25,000
4. Silk Blouse — ₦12,000
5. High-Waist Palazzo — ₦11,500
6. Lace Evening Gown — ₦32,000
7. Casual Co-ord Set — ₦8,500
8. Peplum Blouse — ₦7,800
9. Bodycon Dinner Dress — ₦16,000
10. Boubou Kaftan — ₦20,000

### Children's Collection (10 items)
1. School Uniform Set — ₦8,500
2. Boys Shorts & Polo Set — ₦5,500
3. Girls Party Gown — ₦7,000
4. Kids Native Agbada Set — ₦12,000
5. Baby Romper 3-Pack — ₦6,500
6. Girls Ankara Dress — ₦8,000
7. Boys Jeans & Tee — ₦7,500
8. Kids Birthday Outfit — ₦9,500
9. Toddler Boy Suit — ₦11,000
10. Girls Casual Sun Dress — ₦6,000

---

## Payments — Korapay

Korapay inline checkout is used for all purchases.

- **Public key** — set in Admin → Settings → Korapay Public Key
- **Secret key** — set in Admin → Settings → Korapay Secret Key
- Korapay docs: https://developers.korapay.com

---

## PWA (Progressive Web App)

The store is installable as an app on Android and iOS:

- `public/manifest.json` — app name, theme colour `#c9a96e`, icons
- `public/sw.js` — service worker caches shell assets for offline use
- Install prompt banner appears automatically on supported browsers
- `index.html` — registers the service worker and links the manifest

---

## Deployment

The app auto-deploys to Vercel whenever a commit is pushed to the `main` branch on GitHub.

**Manual redeploy:** push any commit to GitHub → Vercel picks it up within ~60 seconds.

**Vercel project ID:** `prj_rmagTnLuaj8EWSTUZlcr3eWrS870`  
**GitHub repo:** https://github.com/visibyltechnology/shoplike-vintage-store

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Copy `.env.example` to `.env.local` and fill in:
```
VITE_SUPABASE_URL=https://acmxbaswtisoklprfajo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Contact & WhatsApp

Store WhatsApp: **+234 906 317 2596**  
Admin email: **Shoplikevintage@gmail.com**
