# CLAUDE.md — Belediye Envanter Sistemi

AI assistant guide for the Municipality Asset/Inventory Management System.

---

## Project Overview

Full-stack web application for Turkish municipalities to manage movable assets (taşınır). Features multi-tenant data isolation, role-based access control (RBAC), and an asset approval workflow.

- **Backend:** Node.js + Express.js v5 + Knex.js + PostgreSQL (Supabase)
- **Frontend:** Vanilla JS + Bootstrap 5 (Vuexy admin template) + jQuery
- **Deployment:** Vercel (serverless functions)
- **Node version:** `>=20 <21`

---

## Repository Structure

```
/
├── api/                    # Backend (Express.js API)
│   ├── index.js            # Vercel serverless entry point
│   ├── server.js           # Local dev server
│   ├── knexfile.js         # DB configuration (dev/prod/test)
│   ├── package.json
│   └── src/
│       ├── app.js          # Express app setup, middleware chain
│       ├── routes/         # Route registration
│       │   ├── index.js    # Central route mounting
│       │   └── *.route.js  # Per-feature routes
│       ├── controllers/    # Business logic (*.controller.js)
│       ├── middleware/
│       │   ├── auth.js         # JWT validation
│       │   ├── authorize.js    # RBAC enforcement
│       │   └── tenantScope.js  # Multi-tenant scoping
│       └── db/
│           ├── knex.js         # DB connection instance
│           └── migrations/     # Knex migration files
├── admin/                  # Frontend (Vuexy Bootstrap template)
│   ├── *.html              # ~30 page files
│   ├── assets/js/app/      # Feature-specific JS modules
│   ├── assets/css/         # Stylesheets
│   └── package.json        # Gulp/Webpack build config
├── scripts/                # Migration/setup utility scripts
├── vercel.json             # Vercel deployment config
└── TEST_REHBERI.md         # Comprehensive test guide (Turkish)
```

---

## Development Setup

### Backend

```bash
cd api
cp .env.example .env    # Fill in environment variables
npm install
npm run migrate         # Run DB migrations
npm run seed            # Seed initial data (roles, superadmin)
npm start               # Starts on port 4000 with nodemon
```

### Frontend

```bash
cd admin
npm install
npm run build           # One-time build
npm run watch           # Watch mode for development
npm run serve           # Local server with live reload
```

### Environment Variables (`api/.env`)

```
SUPABASE_DB_CONNECTION_STRING=postgresql://...  # Preferred (port 6543, pooling)
SUPABASE_DB_HOST=
SUPABASE_DB_PORT=
SUPABASE_DB_USER=
SUPABASE_DB_PASSWORD=
SUPABASE_DB_NAME=
SUPABASE_DB_SSL=true
JWT_SECRET=
PORT=4000
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## Database

### Connection

PostgreSQL via Supabase. Uses Knex.js as the query builder. Always use the connection pooling URI (port 6543) in production.

- Config: `api/knexfile.js`
- DB instance: `api/src/db/knex.js`

### Migrations

```bash
npm run migrate            # Apply pending migrations
npm run migrate:rollback   # Rollback last batch
npm run migrate:status     # Show migration status
```

Migration files live in `api/src/db/migrations/` and are named `YYYYMMDDHHMMSS_description.js`.

### Multi-Tenant Pattern

**Every query that accesses tenant data MUST include a `municipality_id` filter.** This is the critical data isolation mechanism.

```js
// Correct pattern
knex('assets').where({ municipality_id: req.tenantMunicipalityId, id })

// Never omit municipality_id on tenant-scoped tables
```

Tables with tenant scope: `users`, `assets`, `departments`, `locations`, `asset_categories`, `asset_movements`, `asset_documents`, `logs`, `user_settings`.

Tables without tenant scope (system-wide): `roles`, `municipalities`.

---

## Authentication & Authorization

### Middleware Chain

All protected routes go through this chain:

```
auth → authorize([...roles]) → tenantScope → route handler
```

- **`auth.js`** — Reads JWT from `Authorization: Bearer` header or HttpOnly cookie. Fetches fresh user from DB. Sets `req.user`.
- **`authorize.js`** — Checks `req.user.role_id` against allowed roles. Returns 403 if not authorized.
- **`tenantScope.js`** — Sets `req.tenantMunicipalityId`. Superadmin can bypass with `allowSuperadmin` option.

### Role IDs

| ID | Role | Description |
|----|------|-------------|
| 1 | SUPERADMIN | System admin (all municipalities) |
| 2 | ADMIN | Municipality administrator |
| 3 | TASINIR_KAYIT | Asset registration officer |
| 4 | TASINIR_KONTROL | Asset inspection/approval officer |
| 5 | BIRIM_SORUMLUSU | Department manager |
| 6 | KULLANICI | Regular user (read-only) |

### Route Registration Pattern

```js
// Public route
router.post('/login', loginController);

// Protected, role-restricted route
router.post('/assets/:id/approve',
  auth,
  authorize(['ADMIN', 'TASINIR_KONTROL']),
  tenantScope,
  approveAsset
);
```

---

## Asset Approval Workflow

Assets follow a `pending → approved / rejected` lifecycle:

1. **TASINIR_KAYIT** creates an asset → `approval_status = 'pending'`
2. **TASINIR_KONTROL** or **ADMIN** calls `POST /api/assets/:id/approve` or `/reject`
3. Approved assets store `approved_by_user_id` and `approved_at`

Key fields on `assets` table: `approval_status`, `approved_by_user_id`, `approved_at`.

Frontend: `admin/assets/js/app/assets-approval.js`

---

## API Routes

Base path: `/api`

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/login` | Public | Login |
| POST | `/auth/register` | Public | Register |
| GET | `/assets` | Auth | List assets (supports `?approval_status=pending`) |
| POST | `/assets` | TASINIR_KAYIT+ | Create asset |
| POST | `/assets/:id/approve` | ADMIN, TASINIR_KONTROL | Approve asset |
| POST | `/assets/:id/reject` | ADMIN, TASINIR_KONTROL | Reject asset |
| GET | `/dashboard` | Auth | Dashboard stats |
| GET | `/reports` | Auth | Reports |
| GET/POST | `/users` | ADMIN+ | User management |
| GET/POST | `/departments` | ADMIN+ | Department management |
| GET/POST | `/locations` | ADMIN+ | Location management |
| GET/POST | `/asset-categories` | ADMIN+ | Category management |
| GET | `/audit` | ADMIN+ | Activity logs |
| GET/POST | `/admin/municipalities` | SUPERADMIN | Municipality management |

---

## Frontend Conventions

### Key JS Modules (`admin/assets/js/app/`)

| File | Purpose |
|------|---------|
| `api.js` | Base API URL and shared fetch config |
| `auth-guard.js` | Redirect unauthenticated users |
| `role-based-ui.js` | Show/hide elements based on user role |
| `assets-list.js` | Asset DataTable rendering and filtering |
| `assets-approval.js` | Approve/reject button logic |

### Role-Based UI

UI elements are shown/hidden by `role-based-ui.js` using `data-role` attributes. See `admin/ROL_BAZLI_UI_KURALLARI.md` for the full visibility matrix per role.

### API Calls

Always use the shared `api.js` module for base URL. Use `fetch` with JWT from localStorage. Pattern:

```js
const response = await fetch(`${API_BASE_URL}/assets`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});
```

---

## Testing

### Setup

```bash
cd api
# Create test DB: belediye_envanter_test
# Set NODE_ENV=test in environment
npm run migrate   # Runs migrations on test DB when NODE_ENV=test
```

See `api/TEST_SETUP.md` for full instructions.

### Running Tests

```bash
cd api
npm test                  # All tests
npm run test:integration  # Integration tests (sequential)
npm run test:watch        # Watch mode
```

Tests use Node.js built-in `node:test` module + Supertest. Files follow the pattern `*.controller.test.js` in `api/src/__tests__/`.

### Manual Testing

`TEST_REHBERI.md` (at repo root) is a comprehensive 2,000+ line Turkish guide covering:
- Database verification queries
- Role-based permission scenarios
- curl examples for every endpoint
- Approval workflow test cases

---

## Code Conventions

### Backend

- **Async/await** throughout — no raw promise chains
- **Consistent HTTP responses:** `200`, `201`, `400`, `403`, `404`, `500`
- **Audit fields:** Include `created_by_user_id`, `updated_by_user_id`, `created_at`, `updated_at` on all major tables
- **Cross-tenant validation:** Before any DB write that references another entity, verify it belongs to the same `municipality_id`
- **Error messages in Turkish** for user-facing errors, English for internal/log messages

### File Naming

- Routes: `feature.route.js`
- Controllers: `feature.controller.js`
- Migrations: `YYYYMMDDHHMMSS_descriptive_name.js`
- Frontend JS: `feature-name.js` (kebab-case)

### Adding a New Feature

1. Create migration in `api/src/db/migrations/`
2. Add route file in `api/src/routes/feature.route.js`
3. Add controller in `api/src/controllers/feature.controller.js`
4. Register route in `api/src/routes/index.js` with correct middleware chain
5. Create HTML page in `admin/` and JS module in `admin/assets/js/app/`
6. Update `role-based-ui.js` visibility rules if needed
7. Write tests in `api/src/__tests__/`

---

## Deployment

**Vercel** handles both frontend (static) and backend (serverless function).

- Entry: `api/index.js`
- Config: `vercel.json`
- Function timeout: 30 seconds
- CORS: restricted to known origins + `*.vercel.app` preview deployments

```bash
vercel deploy          # Preview deployment
vercel deploy --prod   # Production deployment
```

---

## Common Pitfalls

1. **Missing `municipality_id` in queries** — Will expose or corrupt cross-tenant data. Always scope queries.
2. **Stale role checks** — Auth middleware fetches fresh user from DB on every request, so role changes take effect immediately.
3. **Frontend token storage** — JWT is in `localStorage`. Refresh handling is not implemented; token expiry requires re-login.
4. **Knex connection pool** — Vercel serverless cold starts can exceed pool limits. Connection string uses port 6543 (PgBouncer) to mitigate this.
5. **Migration order** — Never modify existing migration files. Always create a new migration for schema changes.
6. **Test DB isolation** — Tests must use `NODE_ENV=test` to target `belediye_envanter_test`, not production DB.
