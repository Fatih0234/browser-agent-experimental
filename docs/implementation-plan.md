# Portal Gym - Phase 1 Implementation Plan

## Overview

**Goal**: Build stable foundation for portal-gym benchmark platform  
**Timeline**: 8 milestones, single-owner execution (no parallelism until schema stable)  
**Status**: Milestone 1 complete, ready for Milestone 2

---

## Milestone 1: Project Setup ✅

**Status**: COMPLETE

### Deliverables
- [x] Project folder created at `/home/fatih0234/portal-gym`
- [x] Git repository initialized with remote to `https://github.com/Fatih0234/browser-agent-experimental.git`
- [x] OMX project initialized (`omx agents-init`)
- [x] AGENTS.md updated with portal-gym specific guidance
- [x] Architecture document created at `docs/architecture.md`
- [x] Folder structure created

### Files Created
```
AGENTS.md
├── docs/
│   └── architecture.md
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   └── shared/
├── lib/
├── supabase/
│   └── migrations/
└── playwright-tests/
```

---

## Milestone 2: Next.js Foundation + Auth

**Status**: READY TO START

### Tasks
1. Initialize Next.js 14+ with TypeScript
2. Configure Tailwind CSS with slate theme
3. Initialize shadcn/ui with specified components
4. Install Supabase dependencies (`@supabase/supabase-js`, `@supabase/ssr`)
5. Set up Supabase client (browser + server)
6. Create root layout with providers
7. Create sign-in page
8. Create auth callback handler
9. Create middleware for auth protection
10. Add environment variable template

### Components to Install (shadcn)
- button, input, textarea, label, form, select, dialog, alert-dialog
- dropdown-menu, sheet, tabs, table, card, badge, sonner

### Files to Create
```
app/layout.tsx
app/page.tsx (landing/redirect)
app/(auth)/sign-in/page.tsx
app/(auth)/callback/route.ts
app/(dashboard)/layout.tsx
app/(dashboard)/page.tsx
components/ui/* (shadcn)
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/middleware.ts
.env.example
middleware.ts
```

### Verification
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Sign-in page renders
- [ ] Middleware redirects unauthenticated users

---

## Milestone 3: Database Schema + Migrations

**Status**: PENDING

### Tasks
1. Initialize local Supabase (`supabase init` or use cloud)
2. Create migration for all tables
3. Create RLS policies for each table
4. Create database types for TypeScript
5. Apply migrations to linked project

### Tables to Create
- profiles
- organizations
- memberships
- cases
- documents
- document_versions
- notifications
- audit_events
- scenario_templates
- scenario_runs

### Files to Create
```
supabase/migrations/00000000000000_initial_schema.sql
supabase/types/database.ts (generated)
```

### Verification
- [ ] `supabase db reset` applies cleanly
- [ ] `supabase db diff` shows no pending changes
- [ ] Types generated correctly

---

## Milestone 4: Organization Context + Cases Shell

**Status**: PENDING

### Tasks
1. Create organization context provider
2. Create org switcher component
3. Create navigation sidebar
4. Create case list page
5. Create case detail page
6. Create case CRUD server actions
7. Create audit logging for case actions

### Files to Create
```
components/shared/org-shell.tsx
components/shared/org-switcher.tsx
components/shared/nav-sidebar.tsx
components/shared/header.tsx
app/(dashboard)/[org-slug]/page.tsx
app/(dashboard)/[org-slug]/cases/page.tsx
app/(dashboard)/[org-slug]/cases/[id]/page.tsx
lib/actions/cases.ts
lib/actions/orgs.ts
lib/actions/audit.ts
```

### Verification
- [ ] Org switcher shows user's orgs
- [ ] Switching org updates context
- [ ] Cases list shows only org-scoped cases
- [ ] Audit events created for case actions

---

## Milestone 5: Document Center + Versioning

**Status**: PENDING

### Tasks
1. Create storage bucket migration
2. Create file uploader component
3. Create document list page
4. Create document detail with version history
5. Create document CRUD server actions
6. Integrate with audit logging

### Files to Create
```
supabase/migrations/00000000000001_storage_buckets.sql
components/shared/file-uploader.tsx
app/(dashboard)/[org-slug]/documents/page.tsx
lib/actions/documents.ts
```

### Verification
- [ ] File upload works (test with PDF, CSV, TXT)
- [ ] Files stored in correct bucket path
- [ ] Document metadata saved to database
- [ ] Version history displayed
- [ ] Audit events created for uploads

---

## Milestone 6: Notifications + Audit Log UI

**Status**: PENDING

### Tasks
1. Create notification service
2. Create notification inbox page
3. Create notification list component
4. Create audit log page (admin only)
5. Create audit log table component

### Files to Create
```
app/(dashboard)/[org-slug]/notifications/page.tsx
app/(dashboard)/[org-slug]/audit-log/page.tsx
components/shared/notification-list.tsx
components/shared/audit-log-table.tsx
lib/actions/notifications.ts
```

### Verification
- [ ] Notifications appear for user
- [ ] Org-scoped notifications appear for all members
- [ ] Audit log shows all events for org
- [ ] Admin can view audit log

---

## Milestone 7: Admin Seed/Reset Tool

**Status**: PENDING

### Tasks
1. Create scenario template config
2. Create seed function with markers
3. Create reset function (delete only seeded)
4. Create admin seed/reset page
5. Generate fake PDF, CSV, TXT files for seeding

### Files to Create
```
app/(dashboard)/[org-slug]/admin/seed/page.tsx
lib/actions/scenarios.ts
lib/faker/seed-data.ts
lib/faker/fake-files.ts
```

### Verification
- [ ] Admin can seed data
- [ ] Seeded records marked with seed_run_id
- [ ] Reset only removes seeded data
- [ ] Non-seeded data preserved

---

## Milestone 8: Playwright Tests + Cleanup

**Status**: PENDING

### Tasks
1. Install Playwright
2. Create auth setup (seed test user)
3. Create test 1: auth + dashboard + org switch
4. Create test 2: document upload flow
5. Create test 3: seed/reset flow
6. Run all tests
7. Final cleanup and documentation

### Files to Create
```
playwright.config.ts
playwright-tests/auth.setup.ts
playwright-tests/auth-dashboard.spec.ts
playwright-tests/documents.spec.ts
playwright-tests/scenarios.spec.ts
```

### Verification
- [ ] All 3 tests pass
- [ ] Tests run in CI-ready mode (headless)
- [ ] README.md created with setup instructions

---

## Execution Order

```
M1: Setup ✅
  ↓
M2: Next.js + Auth
  ↓
M3: Database Schema
  ↓
M4: Org Context + Cases
  ↓
M5: Documents
  ↓
M6: Notifications + Audit UI
  ↓
M7: Admin Seed/Reset
  ↓
M8: Tests + Cleanup
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-04-02 | Org roles: Admin + Member | Sufficient for Phase 1, no full RBAC |
| 2025-04-02 | Document versioning: lightweight | Schema now, simple UI, future-proof |
| 2025-04-02 | Notifications: DB + polling | No websockets in Phase 1 |
| 2025-04-02 | Audit retention: indefinite | Phase 1 only, no cleanup needed |
| 2025-04-02 | Seed/reset: marker-based | Safety requirement, only seeded data deleted |
| 2025-04-02 | shadcn theme: slate | Neutral, professional appearance |
| 2025-04-02 | Tests: 3 smoke tests minimum | Cover critical paths: auth, docs, scenarios |

---

## Open Questions

None - all decisions locked for Phase 1.
