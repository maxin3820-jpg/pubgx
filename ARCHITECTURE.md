# Architecture Overview 🏗️

Visual guide to understanding how your PUBG Mobile Survey application works.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   Survey Form    │              │ Admin Dashboard  │        │
│  │   (React UI)     │              │   (React UI)     │        │
│  │                  │              │                  │        │
│  │  - Name input    │              │  - Statistics    │        │
│  │  - Map selector  │              │  - 6 Charts      │        │
│  │  - Weapon picker │              │  - Data table    │        │
│  │  - Mode chips    │              │  - CSV export    │        │
│  │  - Rank slider   │              │  - Refresh       │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
│           │                                 │                  │
│           │                                 │                  │
└───────────┼─────────────────────────────────┼──────────────────┘
            │                                 │
            │ POST /api/submit                │ GET /api/responses
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NETLIFY (CDN + Functions)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TanStack Start Server (SSR)                 │  │
│  │                                                          │  │
│  │  ┌────────────────────┐    ┌───────────────────────┐   │  │
│  │  │  Survey Submission │    │  Admin Data Fetcher   │   │  │
│  │  │    (Client Side)   │    │   (Server Function)   │   │  │
│  │  │                    │    │                       │   │  │
│  │  │ Uses: Publishable  │    │ Uses: Service Role    │   │  │
│  │  │       Key (Public) │    │       Key (Secret)    │   │  │
│  │  └─────────┬──────────┘    └───────────┬───────────┘   │  │
│  │            │                            │               │  │
│  └────────────┼────────────────────────────┼───────────────┘  │
│               │                            │                  │
└───────────────┼────────────────────────────┼──────────────────┘
                │                            │
                │ INSERT                     │ SELECT *
                │                            │
                ▼                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               PostgreSQL Database                        │  │
│  │                                                          │  │
│  │  ┌──────────────────────┐    ┌──────────────────────┐  │  │
│  │  │  survey_responses    │    │    user_roles        │  │  │
│  │  │                      │    │                      │  │  │
│  │  │  - id (UUID)         │    │  - id (UUID)         │  │  │
│  │  │  - player_name       │    │  - user_id           │  │  │
│  │  │  - ign_id            │    │  - role (enum)       │  │  │
│  │  │  - favorite_map      │    │  - created_at        │  │  │
│  │  │  - favorite_weapon   │    │                      │  │  │
│  │  │  - preferred_mode    │    │                      │  │  │
│  │  │  - rank_tier         │    │                      │  │  │
│  │  │  - hours_per_week    │    │                      │  │  │
│  │  │  - feedback          │    │                      │  │  │
│  │  │  - created_at        │    │                      │  │  │
│  │  └──────────────────────┘    └──────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │           Database Functions                     │  │  │
│  │  │  - has_role(role, user_id)                       │  │  │
│  │  │  - get_survey_statistics()                       │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Survey Submission Flow

```
User fills form
      │
      ▼
Validates with Zod schema
      │
      ├─── Invalid? → Show error messages
      │
      ▼ Valid
Creates JSON payload
      │
      ▼
POST to Supabase
(using client-side publishable key)
      │
      ▼
Supabase inserts row
into survey_responses table
      │
      ▼
Success response
      │
      ▼
Show "Winner Winner, Chicken Dinner"
```

### Admin Dashboard Flow

```
User visits /admin
      │
      ▼
TanStack Query fetches data
      │
      ▼
Server function: getSurveyResponses()
(using server-side service role key)
      │
      ▼
Supabase query: SELECT * FROM survey_responses
      │
      ▼
Returns all rows + metadata
      │
      ▼
React processes data:
  ├─ Calculate statistics
  ├─ Group by category (countBy function)
  ├─ Format for charts
  └─ Prepare table rows
      │
      ▼
Recharts renders 6 visualizations
      │
      ▼
Display data table + export button
```

## Component Structure

```
routes/__root.tsx (Layout)
    │
    ├── QueryClientProvider (TanStack Query)
    │   │
    │   ├── routes/index.tsx (Survey Form)
    │   │   │
    │   │   ├── <Field> components (8x)
    │   │   │   ├── Name input
    │   │   │   ├── IGN ID input
    │   │   │   ├── Map <Chips>
    │   │   │   ├── Weapon <Chips>
    │   │   │   ├── Mode <Chips>
    │   │   │   ├── Rank <Chips>
    │   │   │   ├── Hours <range-slim>
    │   │   │   └── Feedback <textarea>
    │   │   │
    │   │   └── Submit button
    │   │
    │   └── routes/admin.tsx (Dashboard)
    │       │
    │       ├── Statistics cards (4x)
    │       ├── <ChartCard> components (6x)
    │       │   ├── Favorite maps (BarChart)
    │       │   ├── Preferred modes (PieChart)
    │       │   ├── Weapons (BarChart horizontal)
    │       │   ├── Ranks (BarChart)
    │       │   ├── Timeline (LineChart)
    │       │   └── Statistics overview
    │       │
    │       └── Response table
    │           ├── Table headers
    │           ├── Data rows (map over responses)
    │           └── Export CSV button
    │
    └── Error boundaries + 404 handler
```

## Tech Stack Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  React 19 + TypeScript                  │
│  Tailwind CSS 4 (Utility-first)         │
│  Radix UI (Accessible components)       │
│  Recharts (Data visualization)          │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Application Layer               │
│  TanStack Router (File-based routing)   │
│  TanStack Query (Data fetching/cache)   │
│  React Hook Form + Zod (Validation)     │
│  Sonner (Toast notifications)           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Server Layer (SSR)              │
│  TanStack Start (Meta-framework)        │
│  Vite (Build tool + dev server)         │
│  Nitro (Server functions)               │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Integration Layer               │
│  Supabase JS Client                     │
│  - Client SDK (browser)                 │
│  - Admin SDK (server)                   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│         Data Layer                      │
│  Supabase (PostgreSQL)                  │
│  - Database tables                      │
│  - Functions & triggers                 │
│  - Real-time subscriptions (optional)   │
└─────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                       PUBLIC ASSETS                         │
│  HTML, CSS, JS, Images (Served by Netlify CDN)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE CODE                        │
│  Environment Variables: VITE_*                              │
│  Access: Publishable Key (anon/public)                     │
│  Permissions: Can INSERT survey_responses                   │
│  Security: Cannot bypass RLS, rate-limited by Supabase     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER FUNCTIONS                         │
│  Environment Variables: SUPABASE_SERVICE_ROLE_KEY          │
│  Access: Service Role Key (full admin)                     │
│  Permissions: Can SELECT/UPDATE/DELETE any data            │
│  Security: Never exposed to browser, runs on Netlify       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  Authentication: API Key validation                         │
│  Authorization: Key type determines permissions            │
│  RLS (Optional): Row Level Security policies               │
│  Audit: All queries logged                                 │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Pipeline

```
Local Development
      │
      ▼
git add . && git commit
      │
      ▼
git push origin main
      │
      ▼
┌─────────────────────┐
│   GitHub Repo       │
│  (Source of truth)  │
└──────────┬──────────┘
           │
           │ Webhook triggers
           │
           ▼
┌─────────────────────┐
│  Netlify Build      │
│                     │
│  1. Clone repo      │
│  2. npm install     │
│  3. npm run build   │
│  4. Deploy .output/ │
└──────────┬──────────┘
           │
           │ Success
           │
           ▼
┌─────────────────────┐
│  Netlify CDN        │
│  (Global edge)      │
│                     │
│  - Caches assets    │
│  - Routes requests  │
│  - Runs functions   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Live Website      │
│ your-site.netlify   │
│       .app          │
└─────────────────────┘
```

## Build Process

```
Source Code (TypeScript + React)
      │
      ▼
Vite (Build tool)
      │
      ├─── TanStack Router
      │    └── Generates route tree
      │
      ├─── TypeScript Compiler
      │    └── Compiles to JavaScript
      │
      ├─── Tailwind CSS
      │    └── Processes utilities
      │
      ├─── Asset Bundler
      │    └── Optimizes images/fonts
      │
      └─── Code Splitter
           └── Creates chunks
                │
                ▼
.output/
    ├── public/           → Static assets (HTML, CSS, JS, images)
    │   ├── assets/       → Hashed filenames for caching
    │   └── index.html    → Entry point
    │
    └── server/           → Serverless functions
        └── index.mjs     → Server function handler
```

## Environment Variables Flow

```
Development (.env file):
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_PUBLISHABLE_KEY=xxx
    SUPABASE_SERVICE_ROLE_KEY=xxx
    VITE_SUPABASE_URL=https://xxx.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=xxx
         │
         ▼
    Vite reads at build time
         │
         ├─── VITE_* variables → Embedded in client bundle
         │                       (visible in browser)
         │
         └─── Non-VITE variables → Used in server functions
                                    (never sent to browser)
         │
         ▼
Production (Netlify Dashboard):
    Set same variables in Netlify UI
         │
         ▼
    Netlify injects at build time
         │
         └─── Same split: client vs server
```

## Request/Response Cycle

### Survey Submission

```
1. User clicks "Submit intel"
   └─> React validates form (client-side)
       └─> POST to Supabase API
           └─> Headers: { apikey: PUBLISHABLE_KEY, ... }
           └─> Body: { player_name: "...", favorite_map: "...", ... }
               └─> Supabase receives request
                   └─> Validates API key
                   └─> Checks schema constraints
                   └─> Inserts row
                   └─> Returns: { data: {...}, error: null }
                       └─> React updates UI
                           └─> Shows success message
```

### Admin Data Fetch

```
1. User visits /admin
   └─> React mounts AdminPanel component
       └─> TanStack Query calls getSurveyResponses()
           └─> Server function executes (Netlify)
               └─> Uses SERVICE_ROLE_KEY (admin access)
               └─> SELECT * FROM survey_responses ORDER BY created_at DESC
                   └─> Supabase returns all rows
                       └─> Server function returns JSON
                           └─> TanStack Query caches result
                               └─> React processes data
                                   ├─> Calculates stats
                                   ├─> Prepares chart data
                                   └─> Renders UI
```

## Performance Optimizations

```
┌─── Asset Optimization ───┐
│  - Image lazy loading    │
│  - Font preloading        │
│  - CSS extraction         │
│  - JS code splitting      │
└───────────────────────────┘

┌─── Caching Strategy ─────┐
│  - CDN edge caching       │
│  - Browser caching        │
│  - TanStack Query cache   │
│  - Supabase connection    │
│    pooling                │
└───────────────────────────┘

┌─── Database Indexes ─────┐
│  - created_at DESC        │
│  - favorite_map           │
│  - favorite_weapon        │
│  - rank_tier              │
│  - user_id (roles)        │
└───────────────────────────┘

┌─── Bundle Optimization ──┐
│  - Tree shaking           │
│  - Minification           │
│  - Compression (gzip)     │
│  - Hashed filenames       │
└───────────────────────────┘
```

## Scalability Considerations

```
Current Limits (Free Tiers):
├─ Netlify: 100GB bandwidth/month
├─ Supabase: 500MB database storage
├─ Supabase: 2GB file storage
└─ Supabase: 50,000 monthly active users

Estimated Capacity:
├─ ~50,000 survey submissions (at 10KB each)
├─ ~1,000,000 page views per month
└─ ~100 concurrent users

Scaling Options:
├─ Netlify Pro: $19/month → 1TB bandwidth
├─ Supabase Pro: $25/month → 8GB database
└─ Read replicas for heavy analytics
```

## Monitoring Points

```
┌─────────────────────────────────────┐
│  Application Metrics                │
│  - Page load time                   │
│  - Form submission success rate     │
│  - Admin dashboard load time        │
│  - Error rate                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Infrastructure Metrics             │
│  - Netlify bandwidth usage          │
│  - Netlify function invocations     │
│  - Build time and success rate      │
│  - CDN cache hit rate               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Database Metrics                   │
│  - Supabase database size           │
│  - Query performance (slow queries) │
│  - Connection pool usage            │
│  - API request count                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Business Metrics                   │
│  - Survey submissions per day       │
│  - Completion rate                  │
│  - Popular choices (map/weapon)     │
│  - Average feedback length          │
└─────────────────────────────────────┘
```

---

## Quick Reference

**Client → Server:** Publishable Key (public, safe to expose)  
**Server → Database:** Service Role Key (secret, admin access)  
**Build Output:** `.output/public` + `.output/server`  
**Deploy Trigger:** Push to `main` branch on GitHub  
**Live in:** ~3-5 minutes after push  

---

**This architecture is production-ready and scales to thousands of users!** 🚀
