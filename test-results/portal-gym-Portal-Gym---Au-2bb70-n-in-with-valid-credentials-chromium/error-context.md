# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Authentication >> should sign in with valid credentials
- Location: playwright-tests/portal-gym.spec.ts:22:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:3001/demo-org"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    6 × unexpected value "http://localhost:3001/sign-in"
    - unexpected value "http://localhost:3001/select-org"
    2 × unexpected value "http://localhost:3001/demo-org"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - banner [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - heading "Portal Gym" [level=1] [ref=e16]
          - generic [ref=e17]:
            - img [ref=e18]
            - combobox [ref=e22]:
              - option "Demo Organization (admin)" [selected]
        - generic [ref=e23]:
          - generic [ref=e24]: test123@gmail.com
          - button "Sign Out" [ref=e26]
    - generic [ref=e27]:
      - navigation [ref=e28]:
        - list [ref=e30]:
          - listitem [ref=e31]:
            - link "Dashboard" [ref=e32] [cursor=pointer]:
              - /url: /demo-org
              - img [ref=e33]
              - text: Dashboard
          - listitem [ref=e38]:
            - link "Cases" [ref=e39] [cursor=pointer]:
              - /url: /demo-org/cases
              - img [ref=e40]
              - text: Cases
          - listitem [ref=e43]:
            - link "Documents" [ref=e44] [cursor=pointer]:
              - /url: /demo-org/documents
              - img [ref=e45]
              - text: Documents
          - listitem [ref=e48]:
            - link "Notifications" [ref=e49] [cursor=pointer]:
              - /url: /demo-org/notifications
              - img [ref=e50]
              - text: Notifications
          - listitem [ref=e53]:
            - link "Audit Log" [ref=e54] [cursor=pointer]:
              - /url: /demo-org/audit-log
              - img [ref=e55]
              - text: Audit Log
          - listitem [ref=e58]:
            - link "Admin" [ref=e59] [cursor=pointer]:
              - /url: /demo-org/admin/seed
              - img [ref=e60]
              - text: Admin
      - main [ref=e62]:
        - generic [ref=e63]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - heading "Portal Gym" [level=1] [ref=e67]
              - generic [ref=e68]:
                - img [ref=e69]
                - combobox [ref=e73]:
                  - option "Demo Organization (admin)" [selected]
            - generic [ref=e74]:
              - generic [ref=e75]: test123@gmail.com
              - button "Sign Out" [ref=e77]
          - generic [ref=e78]:
            - navigation [ref=e79]:
              - list [ref=e81]:
                - listitem [ref=e82]:
                  - link "Dashboard" [ref=e83] [cursor=pointer]:
                    - /url: /demo-org
                    - img [ref=e84]
                    - text: Dashboard
                - listitem [ref=e89]:
                  - link "Cases" [ref=e90] [cursor=pointer]:
                    - /url: /demo-org/cases
                    - img [ref=e91]
                    - text: Cases
                - listitem [ref=e94]:
                  - link "Documents" [ref=e95] [cursor=pointer]:
                    - /url: /demo-org/documents
                    - img [ref=e96]
                    - text: Documents
                - listitem [ref=e99]:
                  - link "Notifications" [ref=e100] [cursor=pointer]:
                    - /url: /demo-org/notifications
                    - img [ref=e101]
                    - text: Notifications
                - listitem [ref=e104]:
                  - link "Audit Log" [ref=e105] [cursor=pointer]:
                    - /url: /demo-org/audit-log
                    - img [ref=e106]
                    - text: Audit Log
                - listitem [ref=e109]:
                  - link "Admin" [ref=e110] [cursor=pointer]:
                    - /url: /demo-org/admin/seed
                    - img [ref=e111]
                    - text: Admin
            - main [ref=e113]:
              - generic [ref=e114]:
                - generic [ref=e115]:
                  - heading "Demo Organization" [level=2] [ref=e116]
                  - paragraph [ref=e117]: Organization Admin
                - generic [ref=e118]:
                  - generic [ref=e119]:
                    - generic [ref=e121]:
                      - img [ref=e122]
                      - text: Cases
                    - generic [ref=e125]:
                      - generic [ref=e126]: "-"
                      - paragraph [ref=e127]: Active cases
                  - generic [ref=e128]:
                    - generic [ref=e130]:
                      - img [ref=e131]
                      - text: Documents
                    - generic [ref=e134]:
                      - generic [ref=e135]: "-"
                      - paragraph [ref=e136]: Total documents
                  - generic [ref=e137]:
                    - generic [ref=e139]:
                      - img [ref=e140]
                      - text: Notifications
                    - generic [ref=e143]:
                      - generic [ref=e144]: "-"
                      - paragraph [ref=e145]: Unread notifications
                  - generic [ref=e146]:
                    - generic [ref=e148]:
                      - img [ref=e149]
                      - text: Organization
                    - generic [ref=e153]:
                      - generic [ref=e154]: demo-org
                      - paragraph [ref=e155]: Slug
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
> 31  |     await expect(page).toHaveURL(/\/dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  79  |     await page.fill('input[name="title"]', 'E2E Test Case');
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
```