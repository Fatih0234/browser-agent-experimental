# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Cases >> should create a new case
- Location: playwright-tests/portal-gym.spec.ts:72:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[name="title"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading [level=1] [ref=e6]: Portal Gym
          - generic [ref=e7]:
            - img [ref=e8]
            - combobox [ref=e12]
        - generic [ref=e13]:
          - generic [ref=e14]: test123@gmail.com
          - button [ref=e16]: Sign Out
    - generic [ref=e17]:
      - navigation [ref=e18]:
        - list [ref=e20]:
          - listitem [ref=e21]:
            - link [ref=e22] [cursor=pointer]:
              - /url: /demo-org
              - img [ref=e23]
              - text: Dashboard
          - listitem [ref=e28]:
            - link [ref=e29] [cursor=pointer]:
              - /url: /demo-org/cases
              - img [ref=e30]
              - text: Cases
          - listitem [ref=e33]:
            - link [ref=e34] [cursor=pointer]:
              - /url: /demo-org/documents
              - img [ref=e35]
              - text: Documents
          - listitem [ref=e38]:
            - link [ref=e39] [cursor=pointer]:
              - /url: /demo-org/notifications
              - img [ref=e40]
              - text: Notifications
          - listitem [ref=e43]:
            - link [ref=e44] [cursor=pointer]:
              - /url: /demo-org/audit-log
              - img [ref=e45]
              - text: Audit Log
          - listitem [ref=e48]:
            - link [ref=e49] [cursor=pointer]:
              - /url: /demo-org/admin/seed
              - img [ref=e50]
              - text: Admin
      - main [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e55]:
            - generic [ref=e56]:
              - heading [level=1] [ref=e57]: Portal Gym
              - generic [ref=e58]:
                - img [ref=e59]
                - combobox [ref=e63]
            - generic [ref=e64]:
              - generic [ref=e65]: test123@gmail.com
              - button [ref=e67]: Sign Out
          - generic [ref=e68]:
            - navigation [ref=e69]:
              - list [ref=e71]:
                - listitem [ref=e72]:
                  - link [ref=e73] [cursor=pointer]:
                    - /url: /demo-org
                    - img [ref=e74]
                    - text: Dashboard
                - listitem [ref=e79]:
                  - link [ref=e80] [cursor=pointer]:
                    - /url: /demo-org/cases
                    - img [ref=e81]
                    - text: Cases
                - listitem [ref=e84]:
                  - link [ref=e85] [cursor=pointer]:
                    - /url: /demo-org/documents
                    - img [ref=e86]
                    - text: Documents
                - listitem [ref=e89]:
                  - link [ref=e90] [cursor=pointer]:
                    - /url: /demo-org/notifications
                    - img [ref=e91]
                    - text: Notifications
                - listitem [ref=e94]:
                  - link [ref=e95] [cursor=pointer]:
                    - /url: /demo-org/audit-log
                    - img [ref=e96]
                    - text: Audit Log
                - listitem [ref=e99]:
                  - link [ref=e100] [cursor=pointer]:
                    - /url: /demo-org/admin/seed
                    - img [ref=e101]
                    - text: Admin
            - main [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e106]:
                    - heading [level=2] [ref=e107]: Cases
                    - paragraph [ref=e108]: Manage and track cases for Demo Organization
                  - button [expanded] [ref=e109]:
                    - button [ref=e110]:
                      - img
                      - text: New Case
                - generic [ref=e111]:
                  - generic [ref=e113]: All Cases
                  - table [ref=e116]:
                    - rowgroup [ref=e117]:
                      - row [ref=e118]:
                        - columnheader [ref=e119]: Title
                        - columnheader [ref=e120]: Type
                        - columnheader [ref=e121]: Status
                        - columnheader [ref=e122]: Priority
                        - columnheader [ref=e123]: Created
                    - rowgroup [ref=e124]:
                      - row [ref=e125]:
                        - cell [ref=e126]:
                          - link [ref=e127] [cursor=pointer]:
                            - /url: /demo-org/cases/f587ae1d-c52e-4ed5-8c79-25df396484d6
                            - text: E2E Test Case - Phase 4
                        - cell [ref=e128]: general
                        - cell [ref=e129]:
                          - generic [ref=e130]: draft
                        - cell [ref=e131]:
                          - generic [ref=e132]: medium
                        - cell [ref=e133]: 4/2/2026
                      - row [ref=e134]:
                        - cell [ref=e135]:
                          - link [ref=e136] [cursor=pointer]:
                            - /url: /demo-org/cases/23c10bc7-439b-4583-bd51-7e67a3920fc7
                            - text: Test Case from Browser Agent
                        - cell [ref=e137]: general
                        - cell [ref=e138]:
                          - generic [ref=e139]: draft
                        - cell [ref=e140]:
                          - generic [ref=e141]: medium
                        - cell [ref=e142]: 4/2/2026
  - generic [ref=e147] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e148]:
      - img [ref=e149]
    - generic [ref=e152]:
      - button "Open issues overlay" [ref=e153]:
        - generic [ref=e154]:
          - generic [ref=e155]: "1"
          - generic [ref=e156]: "2"
        - generic [ref=e157]:
          - text: Issue
          - generic [ref=e158]: s
      - button "Collapse issues badge" [ref=e159]:
        - img [ref=e160]
  - alert [ref=e162]
  - dialog "Create New Case" [ref=e166]:
    - generic [ref=e167]:
      - generic [ref=e168]:
        - heading "Create New Case" [level=2] [ref=e169]
        - paragraph [ref=e170]: Create a new case in Demo Organization
      - generic [ref=e171]:
        - generic [ref=e172]:
          - generic [ref=e173]: Title
          - textbox "Title" [active] [ref=e174]:
            - /placeholder: Enter case title
        - generic [ref=e175]:
          - generic [ref=e176]: Description
          - textbox "Description" [ref=e177]:
            - /placeholder: Enter case description
        - generic [ref=e178]:
          - generic [ref=e179]:
            - generic [ref=e180]: Type
            - combobox [ref=e181]:
              - generic [ref=e182]: general
              - img: ▼
            - textbox [ref=e183]: general
          - generic [ref=e184]:
            - generic [ref=e185]: Priority
            - combobox [ref=e186]:
              - generic [ref=e187]: medium
              - img: ▼
            - textbox [ref=e188]: medium
      - button "Create Case" [ref=e190]
    - button "Close" [ref=e191]:
      - img
      - generic [ref=e192]: Close
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Portal Gym - Core Functionality Smoke Tests
  5   |  * 
  6   |  * These tests verify the foundational features of the benchmark platform:
  7   |  * 1. Authentication flow
  8   |  * 2. Case management
  9   |  * 3. Document center
  10  |  * 4. Admin seed/reset
  11  |  * 5. Audit log
  12  |  */
  13  | 
  14  | const TEST_USER = {
  15  |   email: 'test123@gmail.com',
  16  |   password: 'testpassword123'
  17  | };
  18  | 
  19  | const ORG_SLUG = 'demo-org';
  20  | 
  21  | test.describe('Portal Gym - Authentication', () => {
  22  |   test('should sign in with valid credentials', async ({ page }) => {
  23  |     await page.goto('/sign-in');
  24  |     
  25  |     // Fill sign-in form
  26  |     await page.fill('input[type="email"]', TEST_USER.email);
  27  |     await page.fill('input[type="password"]', TEST_USER.password);
  28  |     await page.click('button[type="submit"]');
  29  |     
  30  |     // Should redirect to dashboard
  31  |     await expect(page).toHaveURL(/\/dashboard/);
  32  |     
  33  |     // Should show org selector (combobox with org name)
  34  |     await expect(page.getByRole('combobox')).toHaveValue('demo-org');
  35  |     
  36  |     // Should show user email
  37  |     await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  38  |   });
  39  | 
  40  |   test('should show error with invalid credentials', async ({ page }) => {
  41  |     await page.goto('/sign-in');
  42  |     
  43  |     await page.fill('input[type="email"]', 'invalid@example.com');
  44  |     await page.fill('input[type="password"]', 'wrongpassword');
  45  |     await page.click('button[type="submit"]');
  46  |     
  47  |     // Should stay on sign-in page
  48  |     await expect(page).toHaveURL(/\/sign-in/);
  49  |     
  50  |     // Should show error
  51  |     await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Portal Gym - Cases', () => {
  56  |   test.beforeEach(async ({ page }) => {
  57  |     // Sign in before each test
  58  |     await page.goto('/sign-in');
  59  |     await page.fill('input[type="email"]', TEST_USER.email);
  60  |     await page.fill('input[type="password"]', TEST_USER.password);
  61  |     await page.click('button[type="submit"]');
  62  |     await page.waitForURL(/\/dashboard/);
  63  |   });
  64  | 
  65  |   test('should show empty state when no cases exist', async ({ page }) => {
  66  |     await page.goto(`/${ORG_SLUG}/cases`);
  67  |     
  68  |     await expect(page.locator('text=No cases yet')).toBeVisible();
  69  |     await expect(page.locator('button:has-text("New Case")')).toBeVisible();
  70  |   });
  71  | 
  72  |   test('should create a new case', async ({ page }) => {
  73  |     await page.goto(`/${ORG_SLUG}/cases`);
  74  |     
  75  |     // Click new case button
  76  |     await page.click('button:has-text("New Case")');
  77  |     
  78  |     // Fill form in dialog
> 79  |     await page.fill('input[name="title"]', 'E2E Test Case');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  80  |     await page.fill('textarea[name="description"]', 'Created by Playwright E2E test');
  81  |     await page.selectOption('select[name="case_type"]', 'general');
  82  |     await page.selectOption('select[name="priority"]', 'medium');
  83  |     
  84  |     // Submit
  85  |     await page.click('button:has-text("Create Case")');
  86  |     
  87  |     // Should show success and list the case
  88  |     await expect(page.locator('text=E2E Test Case')).toBeVisible();
  89  |   });
  90  | 
  91  |   test('should navigate to case detail page', async ({ page }) => {
  92  |     await page.goto(`/${ORG_SLUG}/cases`);
  93  |     
  94  |     // Click on first case link
  95  |     const caseLink = page.locator('a[href*="/cases/"]').first();
  96  |     if (await caseLink.isVisible()) {
  97  |       await caseLink.click();
  98  |       await expect(page).toHaveURL(/\/cases\/[a-f0-9-]+/);
  99  |     }
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Portal Gym - Documents', () => {
  104 |   test.beforeEach(async ({ page }) => {
  105 |     await page.goto('/sign-in');
  106 |     await page.fill('input[type="email"]', TEST_USER.email);
  107 |     await page.fill('input[type="password"]', TEST_USER.password);
  108 |     await page.click('button[type="submit"]');
  109 |     await page.waitForURL(/\/dashboard/);
  110 |   });
  111 | 
  112 |   test('should show empty state when no documents exist', async ({ page }) => {
  113 |     await page.goto(`/${ORG_SLUG}/documents`);
  114 |     
  115 |     await expect(page.locator('text=No documents yet')).toBeVisible();
  116 |     await expect(page.locator('button:has-text("Upload Document")')).toBeVisible();
  117 |   });
  118 | 
  119 |   test('should upload a document', async ({ page }) => {
  120 |     await page.goto(`/${ORG_SLUG}/documents`);
  121 |     
  122 |     // Click upload button to open dialog
  123 |     await page.click('button:has-text("Upload Document")');
  124 |     
  125 |     // Wait for dialog to be visible
  126 |     await expect(page.locator('text=Upload Document').first()).toBeVisible();
  127 |     
  128 |     // Upload a PDF file
  129 |     const fileInput = page.locator('input[type="file"]');
  130 |     await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-document.pdf');
  131 |     
  132 |     // Add description (optional)
  133 |     await page.fill('textarea#description', 'Test PDF Document for Portal Gym');
  134 |     
  135 |     // Submit - click the Upload button inside the dialog
  136 |     await page.locator('button[type="submit"]:has-text("Upload")').click();
  137 |     
  138 |     // Wait for dialog to close and success message
  139 |     await expect(page.locator('text=test-document.pdf')).toBeVisible({ timeout: 10000 });
  140 |   });
  141 | 
  142 |   test('should upload CSV file', async ({ page }) => {
  143 |     await page.goto(`/${ORG_SLUG}/documents`);
  144 |     
  145 |     // Click upload button to open dialog
  146 |     await page.click('button:has-text("Upload Document")');
  147 |     
  148 |     // Wait for dialog to be visible
  149 |     await expect(page.locator('text=Upload Document').first()).toBeVisible();
  150 |     
  151 |     // Upload a CSV file
  152 |     const fileInput = page.locator('input[type="file"]');
  153 |     await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-data.csv');
  154 |     
  155 |     // Add description
  156 |     await page.fill('textarea#description', 'Test CSV data file');
  157 |     
  158 |     // Submit
  159 |     await page.locator('button[type="submit"]:has-text("Upload")').click();
  160 |     
  161 |     // Should appear in list
  162 |     await expect(page.locator('text=test-data.csv')).toBeVisible({ timeout: 10000 });
  163 |   });
  164 | 
  165 |   test('should upload TXT file', async ({ page }) => {
  166 |     await page.goto(`/${ORG_SLUG}/documents`);
  167 |     
  168 |     // Click upload button to open dialog
  169 |     await page.click('button:has-text("Upload Document")');
  170 |     
  171 |     // Wait for dialog to be visible
  172 |     await expect(page.locator('text=Upload Document').first()).toBeVisible();
  173 |     
  174 |     // Upload a TXT file
  175 |     const fileInput = page.locator('input[type="file"]');
  176 |     await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-notes.txt');
  177 |     
  178 |     // Add description
  179 |     await page.fill('textarea#description', 'Test text notes');
```