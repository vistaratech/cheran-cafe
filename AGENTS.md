# ChefCito — AGENTS.md

## Commands

```bash
npm run dev              # next dev --turbopack
npm run build            # next build
npm run typecheck        # tsc --noEmit
npm run lint             # next lint
npm test                 # jest
npm run test:watch       # jest --watch
npm run test:coverage    # jest --coverage
```

Run in order: `typecheck` → `lint` → `test`.

Less common: `npm run dev:debug` (cross-env DEBUG=chefcito:\*), `npm run validate-subscription`.

## Architecture

- **Next.js 16** App Router with Turbopack. All routes in `src/app/` — no `(app)` route group despite stale README.
- **TypeScript strict**, path alias `@/*` → `./src/*`.
- **shadcn/ui** (default style, RSC, neutral base, lucide icons) in `src/components/ui/`.
- **State**: Zustand stores (`src/lib/stores/`) + Valtio + SWR data fetching (`src/lib/swr-fetcher.ts`). Permissions via `src/lib/hooks/use-permissions.ts`.
- **Database**: Mongoose models (`src/models/`) + native MongoDB driver singleton (`src/lib/mongo-init.ts`). `database-service.ts` wraps Mongoose for most CRUD.
- **Docker**: `docker-compose.yml` runs MongoDB 7.0 + mongo-express. Auth: `admin` / `password`, port 27017.
- **Auth**: JWT + Google OAuth. RBAC in `src/lib/access-control.ts` (Owner, Admin, Staff, Waiter, Cashier, Kitchen Staff).
- **PayPhone**: "Cajita de Pagos" — client SDK loaded in root layout, backend under `src/app/api/payphone/`. Env vars: `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`.
- **i18n**: Custom Zustand store (`i18n-store.ts`). Locale files `src/locales/{en,es}.json`, imported directly with `@/locales/...`.
- **Fonts**: PT Sans (body), Space Grotesk (headlines) via Google Fonts in root layout. Font-size scaling classes: `.font-size-{small,medium,large}`.
- **Routes**: POS (`/pos`), KDS (`/kds`), orders, reports, restaurant, profile, login, register, thank-you (PayPhone success).
- **Components**: billing/, subscription/, kds/, layout/, login/, orders/, payment/, pos/, reports/, restaurant/, ui/, users/.

## Testing

- **Jest** with `ts-jest`, `testEnvironment: 'node'`. Config in `jest.config.cjs` (`.cjs` required because `package.json` has `"type": "module"`).
- Tests in `src/__tests__/*.test.ts`.
- Mongoose models mocked via `jest.mock('@/models/...')` — no real DB needed.
- `jest.setup.ts` loads `.env.local`, mocks `debug`, sets 30s timeout.
- Coverage collected for `src/app/api/payphone/**/*.ts` and `src/app/api/subscriptions/**/*.ts`.
- Import handlers directly: `import { POST } from '@/app/api/payphone/confirm/route'`.
- Stale file `src/__tests__/asdasdsa.js` — ignore.

## Env

Copy `.env.local.example` → `.env.local`.

| Var | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | DB name (optional if in URI) |
| `PAYPHONE_TOKEN` | PayPhone API token |
| `PAYPHONE_STORE_ID` | PayPhone store ID |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_BASE_URL` | Canonical app URL (PayPhone redirects) |

## Notes

- `package.json` name is `"nextn"`, not "chefcito".
- `tsconfig.check.json` is stale (content: `// Temp files deleted`).
- `src/app/api/payphone/webhook/` exists but is untested.
- `scripts/` is gitignored (local dev utilities only).
- `src/lib/utils.ts` is a barrel re-exporting constants, types, helpers — import from `@/lib` directly.
