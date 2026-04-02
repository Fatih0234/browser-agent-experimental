# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Audit Log >> should display audit log entries
- Location: playwright-tests/portal-gym.spec.ts:290:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Audit Log')
Expected: visible
Error: strict mode violation: locator('text=Audit Log') resolved to 3 elements:
    1) <a href="/demo-org/audit-log" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-900">…</a> aka getByRole('link', { name: 'Audit Log' }).first()
    2) <a href="/demo-org/audit-log" class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-slate-100 text-slate-900">…</a> aka getByRole('link', { name: 'Audit Log' }).nth(1)
    3) <h2 class="text-2xl font-bold text-slate-900">Audit Log</h2> aka getByRole('heading', { name: 'Audit Log' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Audit Log')

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
                  - heading "Audit Log" [level=2] [ref=e106]
                  - paragraph [ref=e107]: View audit events for Demo Organization
                - generic [ref=e108]:
                  - generic [ref=e110]:
                    - img [ref=e111]
                    - text: Audit Events
                  - img [ref=e116]
  - button "Open Next.js Dev Tools" [ref=e123] [cursor=pointer]:
    - img [ref=e124]
  - alert [ref=e127]
```

# Test source

```ts
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
  267 |     await expect(page.locator('text=Demo Organization')).toBeVisible();
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
> 294 |     await expect(page.locator('text=Audit Log')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
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