# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Cases >> should create a new case
- Location: playwright-tests/portal-gym.spec.ts:72:7

# Error details

```
Error: Channel closed
```

```
Error: page.fill: Test ended.
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
              - /url: /dashboard/demo-org
              - img [ref=e23]
              - text: Dashboard
          - listitem [ref=e28]:
            - link [ref=e29] [cursor=pointer]:
              - /url: /dashboard/demo-org/cases
              - img [ref=e30]
              - text: Cases
          - listitem [ref=e33]:
            - link [ref=e34] [cursor=pointer]:
              - /url: /dashboard/demo-org/documents
              - img [ref=e35]
              - text: Documents
          - listitem [ref=e38]:
            - link [ref=e39] [cursor=pointer]:
              - /url: /dashboard/demo-org/notifications
              - img [ref=e40]
              - text: Notifications
          - listitem [ref=e43]:
            - link [ref=e44] [cursor=pointer]:
              - /url: /dashboard/demo-org/audit-log
              - img [ref=e45]
              - text: Audit Log
          - listitem [ref=e48]:
            - link [ref=e49] [cursor=pointer]:
              - /url: /dashboard/demo-org/admin/seed
              - img [ref=e50]
              - text: Admin
      - main [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e54]:
            - generic [ref=e55]:
              - heading [level=2] [ref=e56]: Cases
              - paragraph [ref=e57]: Manage and track cases for Demo Organization
            - button [expanded] [ref=e58]:
              - button [ref=e59]:
                - img
                - text: New Case
          - generic [ref=e60]:
            - generic [ref=e62]: All Cases
            - table [ref=e65]:
              - rowgroup [ref=e66]:
                - row [ref=e67]:
                  - columnheader [ref=e68]: Title
                  - columnheader [ref=e69]: Type
                  - columnheader [ref=e70]: Status
                  - columnheader [ref=e71]: Priority
                  - columnheader [ref=e72]: Created
              - rowgroup [ref=e73]:
                - row [ref=e74]:
                  - cell [ref=e75]:
                    - link [ref=e76] [cursor=pointer]:
                      - /url: /dashboard/demo-org/cases/23c10bc7-439b-4583-bd51-7e67a3920fc7
                      - text: Test Case from Browser Agent
                  - cell [ref=e77]: general
                  - cell [ref=e78]:
                    - generic [ref=e79]: draft
                  - cell [ref=e80]:
                    - generic [ref=e81]: medium
                  - cell [ref=e82]: 4/2/2026
  - generic [ref=e87] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e88]:
      - img [ref=e89]
    - generic [ref=e92]:
      - button "Open issues overlay" [ref=e93]:
        - generic [ref=e94]:
          - generic [ref=e95]: "1"
          - generic [ref=e96]: "2"
        - generic [ref=e97]:
          - text: Issue
          - generic [ref=e98]: s
      - button "Collapse issues badge" [ref=e99]:
        - img [ref=e100]
  - alert [ref=e102]
  - dialog "Create New Case" [ref=e106]:
    - generic [ref=e107]:
      - generic [ref=e108]:
        - heading "Create New Case" [level=2] [ref=e109]
        - paragraph [ref=e110]: Create a new case in Demo Organization
      - generic [ref=e111]:
        - generic [ref=e112]:
          - generic [ref=e113]: Title
          - textbox "Title" [active] [ref=e114]:
            - /placeholder: Enter case title
        - generic [ref=e115]:
          - generic [ref=e116]: Description
          - textbox "Description" [ref=e117]:
            - /placeholder: Enter case description
        - generic [ref=e118]:
          - generic [ref=e119]:
            - generic [ref=e120]: Type
            - combobox [ref=e121]:
              - generic [ref=e122]: general
              - img: ▼
            - textbox [ref=e123]: general
          - generic [ref=e124]:
            - generic [ref=e125]: Priority
            - combobox [ref=e126]:
              - generic [ref=e127]: medium
              - img: ▼
            - textbox [ref=e128]: medium
      - button "Create Case" [ref=e130]
    - button "Close" [ref=e131]:
      - img
      - generic [ref=e132]: Close
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
      |                ^ Error: page.fill: Test ended.
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
  122 |     // Click upload button
  123 |     await page.click('button:has-text("Upload Document")');
  124 |     
  125 |     // Upload a file
  126 |     const fileInput = page.locator('input[type="file"]');
  127 |     await fileInput.setInputFiles({
  128 |       name: 'test-document.pdf',
  129 |       mimeType: 'application/pdf',
  130 |       buffer: Buffer.from('Fake PDF content for testing')
  131 |     });
  132 |     
  133 |     // Fill document name
  134 |     await page.fill('input[name="name"]', 'Test PDF Document');
  135 |     
  136 |     // Submit
  137 |     await page.click('button:has-text("Upload")');
  138 |     
  139 |     // Should appear in list
  140 |     await expect(page.locator('text=Test PDF Document')).toBeVisible();
  141 |   });
  142 | });
  143 | 
  144 | test.describe('Portal Gym - Admin Seed/Reset', () => {
  145 |   test.beforeEach(async ({ page }) => {
  146 |     await page.goto('/sign-in');
  147 |     await page.fill('input[type="email"]', TEST_USER.email);
  148 |     await page.fill('input[type="password"]', TEST_USER.password);
  149 |     await page.click('button[type="submit"]');
  150 |     await page.waitForURL(/\/dashboard/);
  151 |   });
  152 | 
  153 |   test('should display scenario management page', async ({ page }) => {
  154 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  155 |     
  156 |     await expect(page.locator('text=Scenario Management')).toBeVisible();
  157 |     await expect(page.locator('button:has-text("Seed Data")')).toBeVisible();
  158 |   });
  159 | 
  160 |   test('should seed scenario data', async ({ page }) => {
  161 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  162 |     
  163 |     // Click seed button
  164 |     await page.click('button:has-text("Seed Data")');
  165 |     
  166 |     // Handle confirmation dialog
  167 |     page.on('dialog', dialog => dialog.accept());
  168 |     
  169 |     // Wait for seeding to complete
  170 |     await expect(page.locator('text=Seeded')).toBeVisible({ timeout: 30000 });
  171 |     
  172 |     // Verify cases were created
  173 |     await page.goto(`/${ORG_SLUG}/cases`);
  174 |     await expect(page.locator('text=No cases yet')).not.toBeVisible();
  175 |   });
  176 | 
  177 |   test('should reset scenario data safely', async ({ page }) => {
  178 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  179 |     
```