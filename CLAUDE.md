@AGENTS.md

# rental-marketplace — Claude Reference

## Project Overview

Hyperlocal peer-to-peer rental marketplace MVP. Neighbors in a single locality (Diamond District, Bangalore) can lend and borrow physical items. Focus is on mobile UX, trust (reviews, phone verification), and simplicity.

**Tech stack:**
- **Next.js 16.2.5** + **React 19** — App Router, server components first
- **TypeScript 5** — strict mode enabled
- **Tailwind CSS 4** — utility-first, no config file needed
- **Supabase** — PostgreSQL + Auth (email OTP) + Storage + Edge Functions
- **Twilio** — SMS notifications via Supabase Deno edge functions
- **date-fns** — date math and formatting

---

## Key Directories

```
src/app/(app)/              Protected routes — browse, items, bookings, lend, profile, notifications
src/app/(auth)/             Auth routes — login (email), verify (OTP)
src/app/auth/confirm/       Supabase auth callback handler
src/app/api/                REST API routes (bookings, items, notifications, upload)
src/components/             React components, organized by feature (bookings/, items/, layout/, ui/)
src/lib/supabase/client.ts  Browser Supabase client — use in Client Components only
src/lib/supabase/server.ts  Server Supabase client — use in Server Components and API routes
src/lib/formatters.ts       formatPrice, formatDurationUnit, formatRelativeTime, maskPhone
src/lib/pricing.ts          getLowestPrice, getAvailableUnits, calculateTotalPrice
src/types/index.ts          All shared TypeScript interfaces, enums, and constants
src/hooks/                  Custom React hooks (currently empty — add here)
supabase/migrations/        SQL schema (001_initial_schema.sql) — never edit deployed files
supabase/functions/         Deno edge functions (send-sms-notification, booking-reminder)
middleware.ts               Auth edge middleware — protects all (app) routes
```

---

## Essential Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured. Deployment is via Vercel (Git push to main). Supabase edge functions are deployed with the Supabase CLI.

---

## Coding Conventions

### File Naming
- **Components** → PascalCase: `TopNav.tsx`, `BookingCard.tsx`
- **Pages / routes** → lowercase: `page.tsx`, `layout.tsx`, `route.ts`
- **Utilities / lib** → camelCase: `formatters.ts`, `pricing.ts`
- **Directories** → lowercase: `components/bookings/`, `lib/supabase/`

### Imports
Always use the `@/` alias — never relative `../../` paths.
Use `import type` for TypeScript-only imports.

```ts
// Good
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/formatters'
import type { Item } from '@/types'

// Bad
import { createClient } from '../../lib/supabase/server'
```

### Exports
- **Components** → default export
- **Utilities / hooks** → named exports

### Styling
Use Tailwind utility classes. The following custom classes are defined in `src/app/globals.css` — use them, don't recreate:

| Class | Use |
|---|---|
| `.btn-primary` | Black filled button |
| `.btn-secondary` | White button with black border |
| `.input` | Styled text input |
| `.safe-area-pb` | Bottom safe-area padding (mobile) |
| `.scrollbar-hide` | Hide scrollbars on overflow elements |

Do not create new CSS files. Do not use CSS modules or styled-components.

### State
Server-first. Prefer async server components that query Supabase directly. Use `useState` only for local UI state (toggles, form inputs). There is no global state manager — do not add one.

### API Routes
Export named HTTP method functions. Always authenticate. Always return `NextResponse.json()` with an explicit status.

```ts
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('items').select('*')
  return NextResponse.json({ items: data })
}
```

### TypeScript
Strict mode is on. All domain types live in `src/types/index.ts`. Do not use `any`.

---

## File Boundaries

**Safe to edit:**
- `src/app/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`
- `CLAUDE.md`, `AGENTS.md`
- `next.config.ts`, `middleware.ts`, `eslint.config.mjs`

**Do NOT manually edit:**
- `.next/` — build output (auto-generated)
- `node_modules/` — dependencies
- `supabase/migrations/001_initial_schema.sql` — already deployed; create a new numbered migration file for schema changes
- `.env.local` — contains secrets, git-ignored
- `tsconfig.tsbuildinfo` — incremental build cache

---

## Rules & Constraints

- **Never import the server Supabase client in a Client Component.** `src/lib/supabase/server.ts` uses `next/headers` which is server-only. Use `src/lib/supabase/client.ts` in `'use client'` files.
- **Never hardcode secrets.** Use `process.env.*` only.
- **Never bypass RLS.** All DB queries go through the Supabase JS client with the anon key. Do not use the service role key in client-facing code.
- **No ORM.** The project uses the Supabase JS SDK directly (fluent query API). Do not add Prisma, Drizzle, or similar.
- **No state management library.** Do not add Zustand, Redux, Jotai, etc.
- **No new CSS files.** All styles go in `globals.css` or inline Tailwind classes.
- **Next.js 16 / React 19 — verify APIs before using.** Do not assume behavior from training data. Check `node_modules/next/dist/docs/` for current API surface.

---

## Code Examples

### Server component querying Supabase

```tsx
// src/app/(app)/browse/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/types'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, owner:profiles(id, full_name, avg_rating)')
    .in('status', ['available', 'rented_out'])
    .order('created_at', { ascending: false })
    .limit(40)

  if (sp.q) query = query.ilike('title', `%${sp.q}%`)

  const { data: items } = await query
  return <div>{/* render items */}</div>
}
```

### Using shared types and formatters

```tsx
import type { Item } from '@/types'
import { formatPrice, formatDurationUnit } from '@/lib/formatters'
import { getLowestPrice } from '@/lib/pricing'

function ItemCard({ item }: { item: Item }) {
  const { price, unit } = getLowestPrice(item)
  return <span>{formatPrice(price)}{formatDurationUnit(unit)}</span>
}
```

### Adding a domain type

```ts
// src/types/index.ts — add to existing file, do not create new type files
export interface NewThing {
  id: string
  created_at: string
}
```

---

## Environment Notes

Required variables in `.env.local` (never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

The Supabase project must have RLS enabled and `supabase/migrations/001_initial_schema.sql` applied before the app will function.

---

## Custom Tools & Workflows

- **Edge functions** live in `supabase/functions/` and run on Deno (not Node.js). Deploy with `supabase functions deploy <name>`.
- **`send-sms-notification`** — triggered by booking status changes; sends Twilio SMS to borrower/lender.
- **`booking-reminder`** — cron-triggered; sends reminders before rental start.
- **Schema changes** — create a new migration file (`supabase/migrations/002_*.sql`) rather than editing the existing one. Apply with `supabase db push`.
- No Makefile. No custom scripts beyond the four npm scripts above.
