# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Documents >> should show empty state when no documents exist
- Location: playwright-tests/portal-gym.spec.ts:112:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Upload Document")')
Expected: visible
Error: strict mode violation: locator('button:has-text("Upload Document")') resolved to 2 elements:
    1) <button tabindex="0" type="button" id="base-ui-_r_2_" aria-expanded="false" aria-haspopup="dialog" data-slot="dialog-trigger" data-base-ui-click-trigger="">…</button> aka locator('#base-ui-_r_2_')
    2) <button tabindex="0" type="button" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 da…>…</button> aka getByText('Upload Document')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Upload Document")')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading "Portal Gym" [level=1] [ref=e6]
          - generic [ref=e7]:
            - img [ref=e8]
            - combobox [ref=e12]:
              - option "Demo Organization (admin)" [selected]
        - generic [ref=e13]:
          - generic [ref=e14]: test123@gmail.com
          - button "Sign Out" [ref=e16]
    - generic [ref=e17]:
      - navigation [ref=e18]:
        - list [ref=e20]:
          - listitem [ref=e21]:
            - link "Dashboard" [ref=e22] [cursor=pointer]:
              - /url: /demo-org
              - img [ref=e23]
              - text: Dashboard
          - listitem [ref=e28]:
            - link "Cases" [ref=e29] [cursor=pointer]:
              - /url: /demo-org/cases
              - img [ref=e30]
              - text: Cases
          - listitem [ref=e33]:
            - link "Documents" [ref=e34] [cursor=pointer]:
              - /url: /demo-org/documents
              - img [ref=e35]
              - text: Documents
          - listitem [ref=e38]:
            - link "Notifications" [ref=e39] [cursor=pointer]:
              - /url: /demo-org/notifications
              - img [ref=e40]
              - text: Notifications
          - listitem [ref=e43]:
            - link "Audit Log" [ref=e44] [cursor=pointer]:
              - /url: /demo-org/audit-log
              - img [ref=e45]
              - text: Audit Log
          - listitem [ref=e48]:
            - link "Admin" [ref=e49] [cursor=pointer]:
              - /url: /demo-org/admin/seed
              - img [ref=e50]
              - text: Admin
      - main [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e55]:
            - generic [ref=e56]:
              - heading "Portal Gym" [level=1] [ref=e57]
              - generic [ref=e58]:
                - img [ref=e59]
                - combobox [ref=e63]:
                  - option "Demo Organization (admin)" [selected]
            - generic [ref=e64]:
              - generic [ref=e65]: test123@gmail.com
              - button "Sign Out" [ref=e67]
          - generic [ref=e68]:
            - navigation [ref=e69]:
              - list [ref=e71]:
                - listitem [ref=e72]:
                  - link "Dashboard" [ref=e73] [cursor=pointer]:
                    - /url: /demo-org
                    - img [ref=e74]
                    - text: Dashboard
                - listitem [ref=e79]:
                  - link "Cases" [ref=e80] [cursor=pointer]:
                    - /url: /demo-org/cases
                    - img [ref=e81]
                    - text: Cases
                - listitem [ref=e84]:
                  - link "Documents" [ref=e85] [cursor=pointer]:
                    - /url: /demo-org/documents
                    - img [ref=e86]
                    - text: Documents
                - listitem [ref=e89]:
                  - link "Notifications" [ref=e90] [cursor=pointer]:
                    - /url: /demo-org/notifications
                    - img [ref=e91]
                    - text: Notifications
                - listitem [ref=e94]:
                  - link "Audit Log" [ref=e95] [cursor=pointer]:
                    - /url: /demo-org/audit-log
                    - img [ref=e96]
                    - text: Audit Log
                - listitem [ref=e99]:
                  - link "Admin" [ref=e100] [cursor=pointer]:
                    - /url: /demo-org/admin/seed
                    - img [ref=e101]
                    - text: Admin
            - main [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - generic [ref=e106]:
                    - heading "Documents" [level=2] [ref=e107]
                    - paragraph [ref=e108]: Upload and manage documents for Demo Organization
                  - button "Upload Document" [ref=e109]:
                    - button "Upload Document" [ref=e110]:
                      - img
                      - text: Upload Document
                - generic [ref=e111]:
                  - generic [ref=e113]: All Documents
                  - generic [ref=e115]: No documents yet. Upload your first document to get started.
  - generic [ref=e120] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e121]:
      - img [ref=e122]
    - generic [ref=e125]:
      - button "Open issues overlay" [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]: "2"
          - generic [ref=e129]: "3"
        - generic [ref=e130]:
          - text: Issue
          - generic [ref=e131]: s
      - button "Collapse issues badge" [ref=e132]:
        - img [ref=e133]
  - alert [ref=e135]
```

# Test source

```ts
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
> 116 |     await expect(page.locator('button:has-text("Upload Document")')).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
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
  180 |     
  181 |     // Submit
  182 |     await page.locator('button[type="submit"]:has-text("Upload")').click();
  183 |     
  184 |     // Should appear in list
  185 |     await expect(page.locator('text=test-notes.txt')).toBeVisible({ timeout: 10000 });
  186 |   });
  187 | });
  188 | 
  189 | test.describe('Portal Gym - Admin Seed/Reset', () => {
  190 |   test.beforeEach(async ({ page }) => {
  191 |     await page.goto('/sign-in');
  192 |     await page.fill('input[type="email"]', TEST_USER.email);
  193 |     await page.fill('input[type="password"]', TEST_USER.password);
  194 |     await page.click('button[type="submit"]');
  195 |     await page.waitForURL(/\/dashboard/);
  196 |   });
  197 | 
  198 |   test('should display scenario management page', async ({ page }) => {
  199 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  200 |     
  201 |     await expect(page.locator('text=Scenario Management')).toBeVisible();
  202 |     await expect(page.locator('button:has-text("Seed Data")')).toBeVisible();
  203 |   });
  204 | 
  205 |   test('should seed scenario data', async ({ page }) => {
  206 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  207 |     
  208 |     // Click seed button
  209 |     await page.click('button:has-text("Seed Data")');
  210 |     
  211 |     // Handle confirmation dialog
  212 |     page.on('dialog', dialog => dialog.accept());
  213 |     
  214 |     // Wait for seeding to complete
  215 |     await expect(page.locator('text=Seeded')).toBeVisible({ timeout: 30000 });
  216 |     
```