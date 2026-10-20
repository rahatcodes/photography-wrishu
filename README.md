# Wrishu Photography — Ultra-Fast Portfolio Engine

Production-grade, ultra-fast photography portfolio built for **Navid Mustasim Wrishu** ([wrishu.com](https://wrishu.com)), replacing legacy WordPress infrastructure with a modern React 18, TypeScript, Supabase, and Cloudflare R2 architecture.

---

## ⚡ Performance & Core Highlights

- **Lighthouse 95+ Target**: Sub-1.5s LCP, zero CLS, and route-level code splitting keeping initial visitor bundles under 150KB.
- **Pure Design System**: Clean global CSS tokens matching the exact WordPress screenshots (`#000000` canvas, `#c8914a` accent gold, Montserrat headings, Roboto body, transparent bottom-bordered inputs).
- **Dual Picture Switching**: Hero slider dynamically renders vertical portrait images on mobile (`<768px`) and wide landscape images on desktop/tablet (`>=768px`), fetching only the required file.
- **1L + 3P Gallery Algorithm**: Pure mathematical layout engine partitioning photography collections into repeating 1 Landscape (100% width) + 3 Portrait columns.
- **Client-Side Image Pipeline**: In-browser Canvas/OffscreenCanvas compression converts uploads to AVIF/WebP, strips GPS/EXIF metadata, creates responsive variants (480, 768, 1280, 1920, 2560px), and generates 20px LQIP blur placeholders.
- **Isolated Admin Dashboard (`/admin`)**: Fully separated lazy bundle featuring drag-and-drop uploads, quality sliders, hero slide controls, bio editors, project managers, and inquiry inbox.

---

## 🛠️ Tech Stack & Directory Architecture

```
/
├── src/
│   ├── app/                 # App routing & providers
│   ├── styles/              # Global CSS tokens, base, layout, components, utilities, admin
│   ├── components/          # Header, Footer, ResponsiveImage, Lightbox, StatCounter, LazyMap
│   ├── features/
│   │   ├── home/            # HeroSlider, AboutSection, PortfolioPattern, InstagramStrip
│   │   ├── category/        # CategoryPage (Sports, Street, Nature, Wildlife single column)
│   │   ├── projects/        # ProjectsGrid, URL-synced Project Modal Gallery
│   │   ├── contact/         # ContactsPage & rate-limited form
│   │   └── admin/           # Dashboard, UploaderDropzone, Hero, About, Photos, Settings
│   ├── lib/                 # Image compression, layout math, sample data, Supabase client
│   └── types/               # TypeScript interfaces
├── workers/
│   ├── upload-signer.ts     # Cloudflare Worker verifying Supabase JWT & issuing presigned R2 URLs
│   └── wrangler.toml        # Cloudflare Worker & R2 bucket binding
├── supabase/
│   ├── migrations.sql       # PostgreSQL schema, RLS policies, and Storage bucket permissions
│   └── edge-functions/      # Rate-limited contact form submission function
└── public/
    └── _headers             # Strict CSP, HSTS, and 1-year immutable asset cache headers
```

---

## 🚀 Setup & Deployment Guide

### 1. Supabase Database & Auth Setup

1. Create a new project on [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `/supabase/migrations.sql` and click **Run**. This provisions:
   - `profiles`, `site_settings`, `hero_slides`, `categories`, `photos`, `projects`, `stats`, and `messages` tables.
   - Row Level Security (RLS) policies allowing public read of published content and strictly authenticated admin writes.
   - Public storage bucket `hero` for homepage slider images.

### 2. Creating the First Admin User

1. In Supabase Dashboard, navigate to **Authentication -> Users** and click **Add User -> Create User**.
2. Enter email (e.g. `admin@wrishu.com`) and a strong password.
3. Open the **SQL Editor** and promote the user to administrator:
   ```sql
   INSERT INTO public.profiles (id, email, role)
   VALUES ('<USER-UUID-FROM-AUTH-TAB>', 'admin@wrishu.com', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
4. On `/admin`, you can now log in using these credentials (or test immediately with the preconfigured preview demo account).

### 3. Cloudflare R2 & Worker Setup

1. In Cloudflare Dashboard, go to **R2 Storage -> Create Bucket**:
   - Bucket name: `wrishu-portfolio-photos`
   - Connect a custom domain: `cdn.wrishu.com`
2. Deploy the upload signer worker:
   ```bash
   cd workers
   npm install -g wrangler
   wrangler secret put SUPABASE_JWT_SECRET # Paste JWT secret from Supabase API settings
   wrangler deploy
   ```

### 4. Deploying Frontend to cPanel (Apache / Nginx Shared Hosting)

Since Vite produces a static Single Page Application (SPA), hosting on cPanel is simple and blazing fast:

1. **Configure Environment Variables Locally**:
   Create a `.env.production` file in your project root with your production keys:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   VITE_CLOUDFLARE_R2_CDN="https://cdn.wrishu.com"
   VITE_WORKER_UPLOAD_URL="https://upload-signer.your-name.workers.dev"
   VITE_TURNSTILE_SITE_KEY="your-turnstile-site-key"
   ```
2. **Build the Production Assets**:
   Run the build script:
   ```bash
   npm run build
   ```
   This compiles and tree-shakes all code into the `dist/` directory, including the preconfigured `/public/.htaccess` file.
3. **Upload to cPanel**:
   - Log in to your **cPanel**.
   - Open **File Manager** and enter your website's root folder (usually `public_html/`).
   - If there are old WordPress files, delete or move them to a backup folder.
   - Compress the contents inside your local `dist/` folder into a `.zip` file (make sure `.htaccess` is included!).
   - Upload and extract the zip file directly into `public_html/`.
   - Your site will immediately be live with working client-side routing (`/sports-photography`, `/contacts`, `/admin`, etc.) without 404 reload errors!

### 5. Deploying Frontend to Cloudflare Pages / Vercel (Alternative)

1. In Cloudflare Pages or Vercel, connect this repository.
2. Build configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure environment variables in the project settings.


---

## ➕ How to Add a New Category or Page

1. **Add to Category Definitions**:
   In `/src/lib/mockData.ts` (and in Supabase `categories` table), add the new category:
   ```ts
   { id: '5', title: 'Portraits & Editorial', slug: 'portraits', order: 5 }
   ```
2. **Add Header Nav Link**:
   In `/src/components/Header.tsx`, add the item to `navLinks`:
   ```ts
   { label: 'PORTRAITS', path: '/portraits' }
   ```
3. **Register Route**:
   In `/src/app/App.tsx`, mount the reusable `<CategoryPage>`:
   ```tsx
   <Route path="/portraits" element={<CategoryPage categorySlug="portraits" />} />
   ```
# photography-wrishu
