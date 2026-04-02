# Benchmark Run Record

**Benchmark Version:** 1.0.0

---

## Run Identification

| Field | Value |
|-------|-------|
| Run ID | `RUN-{YYYYMMDD}-{AGENT}-{N}` |
| Date | YYYY-MM-DD |
| Start Time | HH:MM:SS UTC |
| End Time | HH:MM:SS UTC |
| Duration | HH:MM:SS |
| Environment | local / CI / cloud |

---

## Agent Information

| Field | Value |
|-------|-------|
| Agent Name | |
| Agent Version | |
| Configuration | |
| Tooling | MCP / Playwright / Selenium / Other |
| Model | (if applicable) |
| Browser | Chromium / Firefox / Safari |
| Headless | Yes / No |

---

## Environment State

| Check | Status |
|-------|--------|
| Dev Server (port 3001) | ✅ / ❌ |
| Supabase Connected | ✅ / ❌ |
| Test User Seeded | ✅ / ❌ |
| Test Fixtures Present | ✅ / ❌ |
| Clean State (reset run) | ✅ / ❌ |

---

## Task Results

### Task 1: Sign In and Reach Dashboard

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |

**Evidence:**
- Initial Screenshot: `path/to/screenshot`
- Final Screenshot: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 2: Navigate to Cases

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |

**Evidence:**
- Screenshot: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 3: Create Case

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Created Case ID | |

**Evidence:**
- Initial Screenshot: `path/to/screenshot`
- Final Screenshot: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 4: Re-open Created Case After Refresh

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Case ID Verified | Yes / No |

**Evidence:**
- Screenshot After Refresh: `path/to/screenshot`
- Detail Page Screenshot: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 5: Upload PDF

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| File Name | test-document.pdf |

**Evidence:**
- Upload Dialog Screenshot: `path/to/screenshot`
- List After Upload: `path/to/screenshot`
- Console Errors: `none / list`
- Network Status: `200 / error`
- Notes: |

---

### Task 6: Upload CSV

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| File Name | test-data.csv |

**Evidence:**
- Upload Dialog Screenshot: `path/to/screenshot`
- List After Upload: `path/to/screenshot`
- Console Errors: `none / list`
- Network Status: `200 / error`
- Notes: |

---

### Task 7: Find Matching Audit Log Entry

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Case ID Matched | Yes / No |

**Evidence:**
- Audit Log Page: `path/to/screenshot`
- Matching Entry: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 8: Seed Scenario

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Cases Created | |
| Documents Created | |

**Evidence:**
- Seed Dialog: `path/to/screenshot`
- Last Result Card: `path/to/screenshot`
- Cases List After Seed: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

### Task 9: Reset Seeded Data Safely

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Seeded Data Removed | Yes / No |
| Non-Seeded Data Preserved | Yes / No |

**Evidence:**
- Reset Dialog: `path/to/screenshot`
- Cases After Reset: `path/to/screenshot`
- Task 3 Case Still Present: Yes / No
- Console Errors: `none / list`
- Notes: |

---

### Task 10: Recover from Invalid Org Slug

| Field | Value |
|-------|-------|
| Result | PASS / FAIL / SKIP |
| Time (seconds) | |
| Retries | |
| Human Intervention | Yes / No (count) |
| Redirect to Select Org | Yes / No |
| Org Selection Works | Yes / No |

**Evidence:**
- Invalid URL Attempt: `path/to/screenshot`
- Select Org Page: `path/to/screenshot`
- After Selection: `path/to/screenshot`
- Console Errors: `none / list`
- Notes: |

---

## Aggregate Scoring

| Metric | Value |
|--------|-------|
| Total Tasks | 10 |
| Passed | |
| Failed | |
| Skipped | |
| Pass Rate | % |
| Total Time | seconds |
| Avg Time per Task | seconds |
| Total Retries | |
| Human Interventions | |

### Critical Path Status
| Task | Required | Result |
|------|----------|--------|
| 1 (Sign In) | Yes | PASS / FAIL |
| 3 (Create Case) | Yes | PASS / FAIL |
| 5 (Upload PDF) | Yes | PASS / FAIL |
| 8 (Seed Scenario) | Yes | PASS / FAIL |

**Overall Result:** PASS / FAIL

---

## Issues & Observations

### Critical Issues
| # | Issue | Task(s) | Severity |
|---|-------|---------|----------|
| 1 | | | |
| 2 | | | |

### UI/Runtime Errors
| Error | Task | Notes |
|-------|------|-------|
| | | |

### Agent Behavior Observations
| Observation | Task | Notes |
|-------------|------|-------|
| | | |

---

## Evidence Archive

| Type | Location |
|------|----------|
| Screenshots | `benchmark-runs/{date}/{agent}/screenshots/` |
| Console Logs | `benchmark-runs/{date}/{agent}/console.log` |
| Network Logs | `benchmark-runs/{date}/{agent}/network.log` |
| Result JSON | `benchmark-runs/{date}/{agent}/results.json` |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Runner | | |
| Reviewer | | |

---

## Appendix: Raw JSON

```json
{
  "benchmark_version": "1.0.0",
  "run_id": "",
  "date": "",
  "agent": {
    "name": "",
    "version": "",
    "configuration": ""
  },
  "environment": {
    "type": "local",
    "portal_gym_commit": "",
    "supabase_version": ""
  },
  "tasks": [],
  "aggregate": {
    "total_tasks": 10,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "pass_rate_percent": 0,
    "total_time_seconds": 0,
    "avg_task_time_seconds": 0,
    "total_retries": 0,
    "human_interventions": 0,
    "success": false
  },
  "issues": [],
  "notes": ""
}
```

---

*End of Run Record*
