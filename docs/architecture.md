# Portal Gym - Phase 1 Architecture

## Project Overview

The Portal Gym is a **benchmark platform for browser automation validation**. It provides a shared shell for hosting multiple realistic fake portals that can be used to test and validate browser automation agents.

**Phase 1 Goal**: Build the stable foundation (shared shell only)
**Phase 2+ Goal**: Add specific portal workflows (tax, procurement, logistics, HR, etc.)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth & Database | Supabase (Auth + Postgres + Storage) |
| Forms | React Hook Form + Zod |
| Testing | Playwright |
| Deployment | Vercel-ready |

---

## Data Model

### Core Entities

```
profiles
├── id (uuid, PK)
├── user_id (uuid, FK to auth.users)
├── email (text)
├── full_name (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

organizations
├── id (uuid, PK)
├── name (text)
├── slug (text, unique)
├── created_at (timestamptz)
└── updated_at (timestamptz)

memberships
├── id (uuid, PK)
├── org_id (uuid, FK to organizations)
├── user_id (uuid, FK to auth.users)
├── role (enum: admin, member)
├── created_at (timestamptz)
└── updated_at (timestamptz)

cases
├── id (uuid, PK)
├── org_id (uuid, FK to organizations)
├── title (text)
├── description (text, nullable)
├── case_type (text)
├── priority (enum: low, medium, high, urgent)
├── status (enum: draft, open, in_review, needs_correction, closed)
├── assigned_user_id (uuid, FK to auth.users, nullable)
├── created_by (uuid, FK to auth.users)
├── created_at (timestamptz)
└── updated_at (timestamptz)

documents
├── id (uuid, PK)
├── org_id (uuid, FK to organizations)
├── case_id (uuid, FK to cases, nullable)
├── name (text)
├── description (text, nullable)
├── mime_type (text)
├── latest_version_id (uuid, nullable)
├── created_by (uuid, FK to auth.users)
├── created_at (timestamptz)
└── updated_at (timestamptz)

document_versions
├── id (uuid, PK)
├── document_id (uuid, FK to documents)
├── storage_path (text)
├── file_size (bigint)
├── version_number (integer)
├── created_by (uuid, FK to auth.users)
├── created_at (timestamptz)
└── updated_at (timestamptz)

notifications
├── id (uuid, PK)
├── user_id (uuid, FK to profiles, nullable)
├── org_id (uuid, FK to organizations, nullable)
├── case_id (uuid, FK to cases, nullable)
├── type (text)
├── title (text)
├── message (text)
├── read (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)

audit_events
├── id (uuid, PK)
├── org_id (uuid, FK to organizations)
├── user_id (uuid, FK to auth.users, nullable)
├── action (text)
├── entity_type (text)
├── entity_id (uuid, nullable)
├── metadata (jsonb, nullable)
├── created_at (timestamptz)
└── ip_address (text, nullable)

scenario_templates
├── id (uuid, PK)
├── name (text)
├── description (text)
├── config (jsonb)
├── created_at (timestamptz)
└── updated_at (timestamptz)

scenario_runs
├── id (uuid, PK)
├── template_id (uuid, FK to scenario_templates)
├── org_id (uuid, FK to organizations)
├── run_by (uuid, FK to auth.users)
├── status (enum: running, completed, failed)
├── created_count (integer)
├── created_at (timestamptz)
└── completed_at (timestamptz, nullable)
```

---

## Organization Context System

All data access is scoped to an organization. The active organization is tracked in:

1. **URL path** (optional): `/dashboard/[org-slug]/...`
2. **User preference**: stored in user metadata or local storage
3. **Default**: first organization where user is a member

**Organization Switcher**: Dropdown in navigation allowing users to switch between orgs they belong to.

**Role Enforcement**:
- `admin`: Can seed/reset scenarios, manage org data, view audit log
- `member`: Can use normal app surfaces (cases, documents, etc.)

---

## Row Level Security (RLS) Strategy

All tables have RLS enabled with policies:

1. **profiles**: Users can read/write their own profile
2. **organizations**: Members can read their orgs
3. **memberships**: Members can read memberships in their orgs
4. **cases**: Members can CRUD cases in their org
5. **documents**: Members can CRUD documents in their org
6. **document_versions**: Members can read versions for docs they can access
7. **notifications**: Users can read their own + org-scoped notifications
8. **audit_events**: Members can read events for their org (admins can see all)

---

## File Storage (Supabase Storage)

**Bucket**: `documents`

**Path structure**: `{org_id}/{case_id?}/{document_id}/{version_id}.{ext}`

**Security**: Files accessible only to org members via RLS-signed URLs.

**Limits**:
- Max file size: 25MB
- Allowed types: PDF, CSV, TXT, JSON, PNG, JPG

---

## Audit Log Strategy

All meaningful actions are logged to `audit_events`:

| Action | When |
|--------|------|
| `sign_in` | User signs in |
| `sign_out` | User signs out |
| `org_switch` | User switches active org |
| `document_upload` | New document uploaded |
| `document_version_upload` | New version of existing doc |
| `document_delete` | Document deleted/archived |
| `case_create` | New case created |
| `case_update` | Case updated |
| `case_status_change` | Case status changed |
| `scenario_seed` | Admin seeds scenario |
| `scenario_reset` | Admin resets scenario |
| `admin_action` | Any admin-only operation |

---

## Scenario Seed/Reset System

**Seeding**:
- Creates fake organizations, users, cases, documents
- Uses `scenario_runs` to track what was created
- Marks created records with `seed_run_id` for cleanup

**Reset**:
- Only deletes records with matching `seed_run_id`
- Never truncates tables or deletes non-seeded data
- Archives document files before deletion (optional for Phase 1)

**Safety**:
- Only admins can seed/reset
- Confirmation dialog required for reset
- Shows count of records to be deleted before confirmation

---

## Route Structure

```
/                          → Landing or redirect to dashboard
/auth/sign-in              → Sign in page
/auth/sign-out             → Sign out handler
/auth/callback             → OAuth callback
/dashboard                 → Dashboard (redirects to org-specific)
/dashboard/[org-slug]      → Org dashboard
/dashboard/[org-slug]/cases           → Case list
/dashboard/[org-slug]/cases/[id]      → Case detail
/dashboard/[org-slug]/documents       → Document center
/dashboard/[org-slug]/notifications   → Notifications inbox
/dashboard/[org-slug]/audit-log       → Audit log (admin only)
/dashboard/[org-slug]/admin/seed      → Seed/reset tool (admin only)
```

---

## Component Architecture

### Shared Primitives

```
components/
├── ui/                    # shadcn components (auto-generated)
├── shared/
│   ├── org-shell.tsx      # Org-scoped layout wrapper
│   ├── org-switcher.tsx   # Org selection dropdown
│   ├── nav-sidebar.tsx    # Navigation sidebar
│   ├── header.tsx         # Top header bar
│   ├── data-table.tsx     # Reusable table component
│   ├── file-uploader.tsx  # Document upload component
│   ├── audit-log-table.tsx # Audit log display
│   └── notification-list.tsx # Notification inbox
```

### Server Actions

```
app/actions/
├── auth.ts               # Sign in/out
├── orgs.ts               # Org CRUD, switching
├── cases.ts              # Case CRUD
├── documents.ts          # Document upload, versioning
├── notifications.ts      # Notification CRUD
├── audit.ts              # Audit log queries
└── scenarios.ts          # Seed/reset operations
```

---

## Testing Strategy

### Playwright Smoke Tests

1. **Auth + Dashboard Flow**
   - Sign in via Supabase Auth
   - Land on dashboard
   - Switch organization
   - Verify org context updates

2. **Document Flow**
   - Upload a document (real test file)
   - Verify appears in document center
   - Verify metadata/version entry created
   - Download and verify file integrity

3. **Seed/Reset Flow**
   - Admin seeds scenario data
   - Verify seeded records appear
   - Admin resets seeded data
   - Verify only seeded data removed

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment

**Target**: Vercel

**Requirements**:
- Environment variables configured in Vercel dashboard
- Supabase project connected
- Build command: `npm run build`
- Output: static + serverless functions

---

## Phase 1 Completion Criteria

- [ ] Next.js app scaffolded with TypeScript
- [ ] Supabase Auth integrated
- [ ] Database schema + migrations applied
- [ ] RLS policies configured
- [ ] Organization context system working
- [ ] Document center with versioning
- [ ] Audit log recording events
- [ ] Notifications inbox
- [ ] Admin seed/reset tool
- [ ] 3 Playwright smoke tests passing

---

## Future Phases (Not in Scope)

- Portal-specific workflows (tax, procurement, logistics, HR)
- MFA flows
- Real email delivery
- External integrations
- Browser-use runtime integration
- Long-running automation workers
