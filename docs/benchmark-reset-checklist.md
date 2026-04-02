# Benchmark Environment Reset Checklist

**Purpose:** Ensure clean state before each benchmark run

**When to Run:**
- Before starting a new benchmark run
- After a failed/aborted run
- When switching between agents
- Daily if running multiple times

---

## Pre-Reset Verification

| Check | Status |
|-------|--------|
| Dev server accessible (port 3001) | [ ] |
| Supabase running | [ ] |
| Can sign in as test user | [ ] |

---

## Reset Steps

### Step 1: Sign In as Test User
- [ ] Navigate to `http://localhost:3001/sign-in`
- [ ] Enter email: `test123@gmail.com`
- [ ] Enter password: `testpassword123`
- [ ] Click Sign In
- [ ] Verify dashboard loads

### Step 2: Reset Any Existing Scenario Data
- [ ] Navigate to `/demo-org/admin/seed`
- [ ] Check "Scenario Runs" section
- [ ] If any runs exist with "completed" status:
  - Click "Reset" button for each
  - Confirm in AlertDialog
  - Wait for reset to complete
- [ ] Verify "Last Result" shows "No seed operation performed yet"

### Step 3: Clean Up Test Documents
- [ ] Navigate to `/demo-org/documents`
- [ ] Review document list
- [ ] Delete any documents from previous runs:
  - Click delete icon for each test document
  - Confirm deletion
- [ ] Verify only fixture files remain (if any)

### Step 4: Clean Up Test Cases
- [ ] Navigate to `/demo-org/cases`
- [ ] Review case list
- [ ] Note: Cases from "Task 3" of previous run may remain (this is OK)
- [ ] Optional: Delete old benchmark cases if desired

### Step 5: Verify Audit Log
- [ ] Navigate to `/demo-org/audit-log`
- [ ] Verify entries from previous runs present (expected)
- [ ] Note: Audit log is append-only (does not need clearing)

### Step 6: Sign Out
- [ ] Click "Sign Out" button
- [ ] Verify redirect to `/sign-in`

### Step 7: Verify Clean State
- [ ] Attempt to access `/demo-org/cases` while signed out
- [ ] Verify redirect to `/sign-in`
- [ ] Sign in again
- [ ] Verify fresh session

---

## Automated Reset (Recommended)

Run the automated reset script:

```bash
node scripts/benchmark-reset.js
```

This script will:
1. Sign in as test user
2. Reset all scenario runs
3. Delete test documents
4. Sign out
5. Verify clean state

---

## Post-Reset Verification

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Can sign in | Dashboard loads | [ ] |
| Cases page | Shows only persistent cases | [ ] |
| Documents page | Empty or minimal | [ ] |
| Admin seed page | No active scenario runs | [ ] |
| Audit log | Shows history (normal) | [ ] |

---

## Troubleshooting

### Issue: Cannot sign in
**Solution:**
- Check dev server is running: `curl http://localhost:3001/sign-in`
- Verify Supabase is running: `supabase status`
- Check test user exists in database
- Reset test user if needed: `node scripts/setup-test-user.js`

### Issue: Reset button not working
**Solution:**
- Check AlertDialog opens (should not block)
- Verify MCP/Playwright can interact with dialog
- Check browser console for errors
- Try manual reset via SQL if needed

### Issue: Documents not deleting
**Solution:**
- Check storage bucket permissions
- Verify user has delete access
- Check Supabase RLS policies
- Delete via SQL if needed:
  ```sql
  DELETE FROM documents WHERE org_id = 'demo-org-uuid';
  ```

### Issue: Cases still showing after reset
**Solution:**
- This is expected if they weren't seeded
- Task 3 cases are intentional and don't need removal
- Only seeded cases should be reset

---

## Database Reset (Nuclear Option)

**WARNING:** Only use if automated reset fails

```bash
# Stop dev server
pkill -f "next dev"

# Reset Supabase database
supabase db reset

# Restart dev server
PORT=3001 npm run dev

# Re-seed test data
node scripts/setup-test-user.js
```

---

## Quick State Check Command

```bash
curl -s http://localhost:3001/sign-in | grep -q "Sign In" && echo "✅ Server up" || echo "❌ Server down"
```

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Reset Operator | | | |
| Verification | | | |

---

*Reset checklist v1.0.0*
