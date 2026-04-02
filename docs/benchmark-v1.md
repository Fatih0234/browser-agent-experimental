# Portal Gym Benchmark V1

**Version:** 1.0.0  
**Date:** April 2025  
**Status:** Benchmark-Ready  
**App Baseline:** Commit `9e8f7c0`

---

## 1. Benchmark Purpose

Portal Gym Benchmark V1 measures browser agent capability in a realistic multi-tenant SaaS application environment. It tests core browser automation skills required for modern web applications: authentication, navigation, form handling, file upload, and data persistence verification.

### Target Use Cases
- Browser automation framework evaluation
- Agent capability assessment  
- Regression testing for browser agents
- Research and development benchmarking

---

## 2. Environment Details

### Application Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **UI:** React + shadcn/ui + Tailwind CSS
- **Storage:** Supabase Storage (for documents)

### Deployment
- **Local Dev Server:** `http://localhost:3001`
- **Port:** 3001 (required)
- **Dev Mode:** Next.js development server

### Test Credentials
```
Email: test123@gmail.com
Password: testpassword123
Organization: demo-org (slug)
Role: admin
```

### Organization Context
- **Name:** Demo Organization
- **Slug:** `demo-org`
- **User Role:** admin
- **Base URL Pattern:** `/{org-slug}/{route}`

---

## 3. Assumptions & Prerequisites

### System Requirements
- Node.js 20+
- Chromium browser (for Playwright/MCP)
- Supabase CLI (for database operations)

### Pre-Run Setup
1. Portal Gym dev server running on port 3001
2. Supabase local instance running
3. Test user seeded in database
4. Test organization with membership configured

### Test Fixtures
Located in `/tmp/portal-gym-fixtures/`:
- `test-document.pdf` (41 bytes)
- `test-data.csv` (65 bytes)
- `test-notes.txt` (65 bytes)

---

## 4. Task List (10 Tasks)

### Task 1: Sign In and Reach Dashboard
**Objective:** Authenticate and verify dashboard access

**Steps:**
1. Navigate to `/sign-in`
2. Fill email: `test123@gmail.com`
3. Fill password: `testpassword123`
4. Click Sign In button
5. Verify redirect to dashboard (`/demo-org` or `/dashboard`)
6. Verify org switcher shows "Demo Organization"

**Pass Criteria:**
- HTTP 200 on dashboard
- User email visible in header
- Org switcher displays correct org
- Navigation sidebar visible

**Scoring Fields:**
- Time to complete
- Retry count
- Errors encountered

---

### Task 2: Navigate to Cases
**Objective:** Access the case management page

**Steps:**
1. From dashboard, click "Cases" in sidebar
2. Verify navigation to `/demo-org/cases`
3. Verify page heading "Cases"
4. Verify "New Case" button visible

**Pass Criteria:**
- URL is `/demo-org/cases`
- Page heading displays "Cases"
- "New Case" button accessible

---

### Task 3: Create Case
**Objective:** Create a new case with title and description

**Steps:**
1. Click "New Case" button
2. Fill Title: `Benchmark Test Case`
3. Fill Description: `Created during benchmark run`
4. Select Type: `general` (default)
5. Select Priority: `medium` (default)
6. Click "Create Case"
7. Verify case appears in list

**Pass Criteria:**
- Dialog closes successfully
- Case appears in list
- Case title visible in table
- No console errors

**State Capture:** Record created case ID

---

### Task 4: Re-open Created Case After Refresh
**Objective:** Verify case persistence

**Steps:**
1. Note case ID from Task 3
2. Hard refresh page (Ctrl+R or Cmd+R)
3. Verify case still in list
4. Click case title to open detail
5. Verify case detail page loads
6. Verify title matches Task 3

**Pass Criteria:**
- Case persists after refresh
- Detail page loads correctly
- Data matches original entry

---

### Task 5: Upload PDF
**Objective:** Upload a PDF document

**Steps:**
1. Navigate to `/demo-org/documents`
2. Click "Upload Document" button
3. Select `test-document.pdf`
4. Fill description: `PDF upload test`
5. Click "Upload"
6. Wait for upload to complete
7. Verify document in list

**Pass Criteria:**
- Upload succeeds (200 OK)
- Document appears in list
- File name visible (`test-document.pdf`)
- No console errors

**Tooling Note:** Requires Playwright (MCP cannot automate file picker)

---

### Task 6: Upload CSV
**Objective:** Upload a CSV document

**Steps:**
1. Navigate to `/demo-org/documents`
2. Click "Upload Document" button
3. Select `test-data.csv`
4. Fill description: `CSV upload test`
5. Click "Upload"
6. Verify document in list

**Pass Criteria:**
- Upload succeeds
- Document appears in list
- File name visible (`test-data.csv`)

---

### Task 7: Find Matching Audit Log Entry
**Objective:** Navigate to audit log and find case creation entry

**Steps:**
1. Navigate to `/demo-org/audit-log`
2. Verify "Audit Log" heading
3. Look for "Created Case" action
4. Verify target matches case from Task 3
5. Verify user attribution correct
6. Verify timestamp reasonable

**Pass Criteria:**
- Audit log page loads
- "Created Case" entry visible
- Target ID matches Task 3 case
- User matches test user

---

### Task 8: Seed Scenario
**Objective:** Use admin seed functionality to create test data

**Steps:**
1. Navigate to `/demo-org/admin/seed`
2. Verify "Scenario Management" page
3. Click "Seed Data" button
4. Confirm in AlertDialog (click "Continue")
5. Wait for seeding to complete
6. Verify "Last Result" shows created items
7. Verify cases appear in `/demo-org/cases`

**Pass Criteria:**
- Seed dialog opens
- Confirmation accepted
- Cases created (typically 5)
- Documents created (typically 15)
- "Last Result" card updated

---

### Task 9: Reset Seeded Data Safely
**Objective:** Remove only seeded data, preserve other data

**Steps:**
1. On `/demo-org/admin/seed`, locate seeded run
2. Click "Reset" button for that run
3. Confirm in AlertDialog (click "Reset Data")
4. Wait for reset to complete
5. Verify seeded cases removed from `/demo-org/cases`
6. Verify non-seeded data (Task 3 case) still exists

**Pass Criteria:**
- Reset dialog opens
- Confirmation accepted
- Seeded data removed
- Non-seeded data preserved
- "Last Result" cleared

---

### Task 10: Recover from Invalid Org Slug
**Objective:** Handle invalid URL gracefully

**Steps:**
1. Navigate to `/invalid-org/cases` (invalid slug)
2. Verify redirect to `/select-org`
3. Verify org selector displayed
4. Select "Demo Organization"
5. Verify navigation to `/demo-org`

**Pass Criteria:**
- Redirects to `/select-org` (not 404)
- Org selector accessible
- Can select valid org
- Navigation succeeds after selection

---

## 5. Pass/Fail Rules

### Task Pass Criteria
- All required steps completed in sequence
- Expected UI state observed at each step
- No critical errors (console or network)
- Final state matches expected outcome

### Run Pass Criteria
- Minimum 8/10 tasks pass
- Tasks 1, 3, 5, 8 must pass (critical path)
- No more than 3 retries per task
- No human intervention required

### Fail Conditions
- Crash or unrecoverable error
- Timeout (>30s per task without progress)
- Data corruption or unexpected side effects
- Manual intervention required

---

## 6. Scoring Schema

### Per-Task Scoring

```json
{
  "task_id": "string",
  "task_name": "string",
  "result": "pass|fail|skip",
  "completion_time_seconds": number,
  "retry_count": number,
  "human_intervention_count": number,
  "ui_errors": ["error1", "error2"],
  "runtime_errors": ["error1", "error2"],
  "final_state_correct": boolean,
  "notes": "string"
}
```

### Run-Level Scoring

```json
{
  "benchmark_version": "1.0.0",
  "agent_name": "string",
  "agent_version": "string",
  "run_date": "ISO8601",
  "environment": "local|ci",
  "total_tasks": 10,
  "passed_tasks": number,
  "failed_tasks": number,
  "skipped_tasks": number,
  "total_time_seconds": number,
  "avg_task_time_seconds": number,
  "total_retries": number,
  "human_interventions": number,
  "pass_rate_percent": number,
  "success": boolean
}
```

### Scoring Weights
- Task completion: 60%
- Correctness: 20%
- Efficiency (time): 10%
- Robustness (retries): 10%

---

## 7. Run Procedure

### Pre-Run Checklist
- [ ] Environment reset completed
- [ ] Dev server running on port 3001
- [ ] Supabase connected
- [ ] Test fixtures available
- [ ] Agent configured
- [ ] Screenshot/logging enabled

### Run Execution
1. **Initialize:** Record start time, agent details
2. **Execute Tasks:** Run Task 1-10 sequentially
3. **Capture Evidence:** Screenshots, console logs, network logs
4. **Record Results:** Fill scoring fields per task
5. **Calculate Score:** Compute aggregate metrics
6. **Generate Report:** Export benchmark-run-template.md

### Post-Run
- [ ] Environment reset for next run
- [ ] Evidence archived
- [ ] Results committed to tracking

---

## 8. Evidence Collection Rules

### Required Evidence per Task
- Screenshot of initial state
- Screenshot of final state
- Console log excerpt (if errors)
- Network log excerpt (if API failures)

### Required Evidence per Run
- Agent configuration details
- Environment version info
- Full task result JSON
- Aggregate scoring JSON
- Any anomalies or observations

### Evidence Storage
- Screenshots: `benchmark-runs/{date}/{agent}/task-{n}/`
- Logs: `benchmark-runs/{date}/{agent}/logs/`
- Results: `benchmark-runs/{date}/{agent}/results.json`

---

## 9. Known Limitations

### MCP Limitations
- Cannot automate OS file picker dialogs (Task 5, 6 require Playwright)
- Extended sessions may timeout (>15 minutes)
- Native dialogs block automation (fixed with custom AlertDialog)

### App Limitations
- Dev mode performance slower than production
- File upload requires real browser (not headless-only)
- Session timeout after extended inactivity

### Test Limitations
- Single-user, single-org scenario
- Fixed test fixtures
- No concurrent user testing
- No mobile viewport testing

---

## 10. Changelog

### v1.0.0 (April 2025)
- Initial benchmark release
- 10 core tasks defined
- Scoring schema established
- Ready for agent comparison

---

## Appendix A: Quick Reference

### URLs
```
Sign In:      /sign-in
Dashboard:    /demo-org
Cases:        /demo-org/cases
Documents:    /demo-org/documents
Audit Log:    /demo-org/audit-log
Admin Seed:   /demo-org/admin/seed
Select Org:   /select-org
```

### Test User
```
Email:    test123@gmail.com
Password: testpassword123
Org:      demo-org
```

### Test Fixtures
```
/tmp/portal-gym-fixtures/test-document.pdf
/tmp/portal-gym-fixtures/test-data.csv
/tmp/portal-gym-fixtures/test-notes.txt
```

---

*End of Benchmark V1 Documentation*
