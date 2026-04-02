# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-gym.spec.ts >> Portal Gym - Audit Log >> should log case creation events
- Location: playwright-tests/portal-gym.spec.ts:300:7

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
> 304 |     await page.fill('input[name="title"]', 'Audit Test Case');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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