# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Navigation >> should show org switcher with correct org
- Location: playwright-tests/portal-gym.spec.ts:263:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Demo Organization')
Expected: visible
Error: strict mode violation: locator('text=Demo Organization') resolved to 2 elements:
    1) <option value="demo-org">Demo Organization (admin)</option> aka getByRole('combobox')
    2) <p class="text-slate-600">Manage and track cases for Demo Organization</p> aka getByText('Manage and track cases for')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Demo Organization')

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
            - text: Loading...
        - generic [ref=e12]:
          - generic [ref=e13]: test123@gmail.com
          - button "Sign Out" [ref=e15]
    - main [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - heading "Portal Gym" [level=1] [ref=e22]
            - generic [ref=e23]:
              - img [ref=e24]
              - combobox [ref=e28]:
                - option "Demo Organization (admin)" [selected]
          - generic [ref=e29]:
            - generic [ref=e30]: test123@gmail.com
            - button "Sign Out" [ref=e32]
        - generic [ref=e33]:
          - navigation [ref=e34]:
            - list [ref=e36]:
              - listitem [ref=e37]:
                - link "Dashboard" [ref=e38] [cursor=pointer]:
                  - /url: /demo-org
                  - img [ref=e39]
                  - text: Dashboard
              - listitem [ref=e44]:
                - link "Cases" [ref=e45] [cursor=pointer]:
                  - /url: /demo-org/cases
                  - img [ref=e46]
                  - text: Cases
              - listitem [ref=e49]:
                - link "Documents" [ref=e50] [cursor=pointer]:
                  - /url: /demo-org/documents
                  - img [ref=e51]
                  - text: Documents
              - listitem [ref=e54]:
                - link "Notifications" [ref=e55] [cursor=pointer]:
                  - /url: /demo-org/notifications
                  - img [ref=e56]
                  - text: Notifications
              - listitem [ref=e59]:
                - link "Audit Log" [ref=e60] [cursor=pointer]:
                  - /url: /demo-org/audit-log
                  - img [ref=e61]
                  - text: Audit Log
              - listitem [ref=e64]:
                - link "Admin" [ref=e65] [cursor=pointer]:
                  - /url: /demo-org/admin/seed
                  - img [ref=e66]
                  - text: Admin
          - main [ref=e68]:
            - generic [ref=e69]:
              - generic [ref=e70]:
                - generic [ref=e71]:
                  - heading "Cases" [level=2] [ref=e72]
                  - paragraph [ref=e73]: Manage and track cases for Demo Organization
                - button "New Case" [ref=e74]:
                  - button "New Case" [ref=e75]:
                    - img
                    - text: New Case
              - generic [ref=e76]:
                - generic [ref=e78]: All Cases
                - img [ref=e81]
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
```

# Test source

```ts
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
  217 |     // Verify cases were created
  218 |     await page.goto(`/${ORG_SLUG}/cases`);
  219 |     await expect(page.locator('text=No cases yet')).not.toBeVisible();
  220 |   });
  221 | 
  222 |   test('should reset scenario data safely', async ({ page }) => {
  223 |     await page.goto(`/${ORG_SLUG}/admin/seed`);
  224 |     
  225 |     // Find and click reset button for a completed run
  226 |     const resetButton = page.locator('button:has-text("Reset")').first();
  227 |     if (await resetButton.isVisible()) {
  228 |       await resetButton.click();
  229 |       
  230 |       // Handle confirmation dialog
  231 |       page.on('dialog', dialog => dialog.accept());
  232 |       
  233 |       // Should show success
  234 |       await expect(page.locator('text=reset successfully')).toBeVisible();
  235 |     }
  236 |   });
  237 | });
  238 | 
  239 | test.describe('Portal Gym - Navigation', () => {
  240 |   test.beforeEach(async ({ page }) => {
  241 |     await page.goto('/sign-in');
  242 |     await page.fill('input[type="email"]', TEST_USER.email);
  243 |     await page.fill('input[type="password"]', TEST_USER.password);
  244 |     await page.click('button[type="submit"]');
  245 |     await page.waitForURL(/\/dashboard/);
  246 |   });
  247 | 
  248 |   test('should navigate between all main pages', async ({ page }) => {
  249 |     const pages = [
  250 |       { name: 'Cases', path: `/${ORG_SLUG}/cases` },
  251 |       { name: 'Documents', path: `/${ORG_SLUG}/documents` },
  252 |       { name: 'Notifications', path: `/${ORG_SLUG}/notifications` },
  253 |       { name: 'Audit Log', path: `/${ORG_SLUG}/audit-log` },
  254 |       { name: 'Admin', path: `/${ORG_SLUG}/admin/seed` },
  255 |     ];
  256 | 
  257 |     for (const nav of pages) {
  258 |       await page.goto(nav.path);
  259 |       await expect(page.locator(`text=${nav.name}`).first()).toBeVisible();
  260 |     }
  261 |   });
  262 | 
  263 |   test('should show org switcher with correct org', async ({ page }) => {
  264 |     await page.goto(`/${ORG_SLUG}/cases`);
  265 |     
  266 |     // Org selector should show current org
> 267 |     await expect(page.locator('text=Demo Organization')).toBeVisible();
      |                                                          ^ Error: expect(locator).toBeVisible() failed
  268 |   });
  269 | 
  270 |   test('should sign out successfully', async ({ page }) => {
  271 |     await page.goto(`/${ORG_SLUG}/cases`);
  272 |     
  273 |     // Click sign out
  274 |     await page.click('button:has-text("Sign Out")');
  275 |     
  276 |     // Should redirect to sign-in
  277 |     await expect(page).toHaveURL(/\/sign-in/);
  278 |   });
  279 | });
  280 | 
  281 | test.describe('Portal Gym - Audit Log', () => {
  282 |   test.beforeEach(async ({ page }) => {
  283 |     await page.goto('/sign-in');
  284 |     await page.fill('input[type="email"]', TEST_USER.email);
  285 |     await page.fill('input[type="password"]', TEST_USER.password);
  286 |     await page.click('button[type="submit"]');
  287 |     await page.waitForURL(/\/dashboard/);
  288 |   });
  289 | 
  290 |   test('should display audit log entries', async ({ page }) => {
  291 |     await page.goto(`/${ORG_SLUG}/audit-log`);
  292 |     
  293 |     // Should show audit log heading
  294 |     await expect(page.locator('text=Audit Log')).toBeVisible();
  295 |     
  296 |     // Table or list should be present
  297 |     await expect(page.locator('table, [role="list"]').first()).toBeVisible();
  298 |   });
  299 | 
  300 |   test('should log case creation events', async ({ page }) => {
  301 |     // Create a case first
  302 |     await page.goto(`/${ORG_SLUG}/cases`);
  303 |     await page.click('button:has-text("New Case")');
  304 |     await page.fill('input[name="title"]', 'Audit Test Case');
  305 |     await page.fill('textarea[name="description"]', 'Testing audit logging');
  306 |     await page.click('button:has-text("Create Case")');
  307 |     
  308 |     // Check audit log
  309 |     await page.goto(`/${ORG_SLUG}/audit-log`);
  310 |     
  311 |     // Should show case creation event
  312 |     await expect(page.locator('text=case_created, text=Audit Test Case').first()).toBeVisible();
  313 |   });
  314 | });
  315 | 
```