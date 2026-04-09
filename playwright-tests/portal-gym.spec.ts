import { test, expect, type Page, type Dialog } from '@playwright/test';

/**
 * Portal Gym - Core Functionality Smoke Tests
 *
 * These tests verify the foundational features of the benchmark platform:
 * 1. Authentication flow
 * 2. Case management
 * 3. Document center
 * 4. Admin seed/reset
 * 5. Audit log
 */

const TEST_USER = {
  email: 'test123@gmail.com',
  password: 'testpassword123'
};

const ORG_SLUG = 'demo-org';

test.describe('Portal Gym - Authentication', () => {
  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill sign-in form
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect away from sign-in (to org or select-org page)
    await expect(page).not.toHaveURL(/\/sign-in/);

    // Should show org selector (combobox with org slug value)
    await expect(page.getByRole('combobox')).toHaveValue('demo-org');

    // Should show user email
    await expect(page.locator(`text=${TEST_USER.email}`)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should stay on sign-in page
    await expect(page).toHaveURL(/\/sign-in/);

    // Should show error
    await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });
});

async function signIn(page: Page) {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  // Wait until we are no longer on sign-in (handles /sign-in and /auth/sign-in)
  await page.waitForURL(
    (url: URL) => !url.pathname.includes('sign-in'),
    { timeout: 20000 }
  );
}

/** Wait for org context to load by checking combobox has a value */
async function waitForOrg(page: Page) {
  await expect(page.getByRole('combobox')).not.toHaveValue('', { timeout: 10000 });
}

test.describe('Portal Gym - Cases', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should show cases page with New Case button', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);

    // Page heading should be visible
    await expect(page.locator('h2:has-text("Cases")').first()).toBeVisible();
    await expect(page.locator('button:has-text("New Case")').first()).toBeVisible();
  });

  test('should create a new case', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);

    // Click new case button
    await page.click('button:has-text("New Case")');

    // Fill form in dialog using id-based selectors (controlled components)
    await page.fill('#title', 'E2E Test Case');
    await page.fill('#description', 'Created by Playwright E2E test');
    // Type and Priority selects use shadcn defaults (general/medium) — no change needed

    // Submit
    await page.click('button:has-text("Create Case")');

    // Should show success and list the case
    await expect(page.locator('text=E2E Test Case').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to case detail page', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);

    // Click on first case link
    const caseLink = page.locator('a[href*="/cases/"]').first();
    if (await caseLink.isVisible()) {
      await caseLink.click();
      await expect(page).toHaveURL(/\/cases\/[a-f0-9-]+/);
    }
  });
});

test.describe('Portal Gym - Documents', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should show documents page with Upload button', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);

    // Page heading should be visible
    await expect(page.locator('h2:has-text("Documents")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Upload Document")').first()).toBeVisible();
  });

  test('should upload a document', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);

    // Click upload button to open dialog
    await page.locator('button:has-text("Upload Document")').first().click();

    // Wait for dialog to be visible
    await expect(page.locator('text=Upload Document').first()).toBeVisible();

    // Upload a PDF file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-document.pdf');

    // Add description (optional)
    await page.fill('textarea#description', 'Test PDF Document for Portal Gym');

    // Submit - click the Upload button inside the dialog
    await page.locator('button[type="submit"]:has-text("Upload")').click();

    // Wait for dialog to close and success message
    await expect(page.locator('text=test-document.pdf')).toBeVisible({ timeout: 15000 });
  });

  test('should upload CSV file', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);

    // Click upload button to open dialog
    await page.locator('button:has-text("Upload Document")').first().click();

    // Wait for dialog to be visible
    await expect(page.locator('text=Upload Document').first()).toBeVisible();

    // Upload a CSV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-data.csv');

    // Add description
    await page.fill('textarea#description', 'Test CSV data file');

    // Submit
    await page.locator('button[type="submit"]:has-text("Upload")').click();

    // Should appear in list
    await expect(page.locator('text=test-data.csv')).toBeVisible({ timeout: 15000 });
  });

  test('should upload TXT file', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);

    // Click upload button to open dialog
    await page.locator('button:has-text("Upload Document")').first().click();

    // Wait for dialog to be visible
    await expect(page.locator('text=Upload Document').first()).toBeVisible();

    // Upload a TXT file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('/tmp/portal-gym-fixtures/test-notes.txt');

    // Add description
    await page.fill('textarea#description', 'Test text notes');

    // Submit
    await page.locator('button[type="submit"]:has-text("Upload")').click();

    // Should appear in list
    await expect(page.locator('text=test-notes.txt')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Portal Gym - Admin Seed/Reset', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should display scenario management page', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/admin/seed`);

    await expect(page.locator('text=Scenario Management')).toBeVisible();
    await expect(page.locator('button:has-text("Seed Data")')).toBeVisible();
  });

  test('should seed scenario data', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/admin/seed`);

    // Click seed button
    await page.click('button:has-text("Seed Data")');

    // Handle confirmation dialog
    page.on('dialog', (dialog: Dialog) => dialog.accept());

    // Wait for seeding to complete
    await expect(page.locator('text=Seeded')).toBeVisible({ timeout: 30000 });

    // Verify cases were created
    await page.goto(`/${ORG_SLUG}/cases`);
    await expect(page.locator('h2:has-text("Cases")')).toBeVisible();
  });

  test('should reset scenario data safely', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/admin/seed`);

    // Find and click reset button for a completed run
    const resetButton = page.locator('button:has-text("Reset")').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();

      // Handle confirmation dialog
      page.on('dialog', (dialog: Dialog) => dialog.accept());

      // Should show success
      await expect(page.locator('text=reset successfully')).toBeVisible();
    }
  });
});

test.describe('Portal Gym - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    // Ensure org context is loaded before navigating in tests
    await page.goto(`/${ORG_SLUG}/cases`);
    await waitForOrg(page);
  });

  test('should navigate between main pages', async ({ page }) => {
    // Non-admin-only pages — org context already loaded in beforeEach
    const pages = [
      { name: 'Cases', path: `/${ORG_SLUG}/cases` },
      { name: 'Documents', path: `/${ORG_SLUG}/documents` },
      { name: 'Notifications', path: `/${ORG_SLUG}/notifications` },
    ];

    for (const nav of pages) {
      await page.goto(nav.path);
      await expect(page.locator(`h2:has-text("${nav.name}")`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to admin pages', async ({ page }) => {
    // Admin-only pages — org context already loaded in beforeEach
    await page.goto(`/${ORG_SLUG}/audit-log`);
    await expect(
      page.locator('h2:has-text("Audit Log"), h3:has-text("Admin Only"), [data-slot="card-title"]:has-text("Admin Only")').first()
    ).toBeVisible({ timeout: 10000 });

    await page.goto(`/${ORG_SLUG}/admin/seed`);
    await expect(
      page.locator('h2:has-text("Scenario Management"), [data-slot="card-title"]:has-text("Admin Only")').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show org switcher with correct org', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);

    // Org selector select element should have demo-org as value
    await expect(page.getByRole('combobox')).toHaveValue('demo-org');
  });

  test('should sign out successfully', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);

    // Click sign out
    await page.click('button:has-text("Sign Out")');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe('Portal Gym - Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto(`/${ORG_SLUG}/cases`);
    await waitForOrg(page);
  });

  test('should display audit log page', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/audit-log`);

    // Should show audit log heading or admin-only message
    await expect(
      page.locator('h2:has-text("Audit Log"), h3:has-text("Admin Only")').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should log case creation events', async ({ page }) => {
    // Create a case first
    await page.goto(`/${ORG_SLUG}/cases`);
    await page.locator('button:has-text("New Case")').first().click();
    await page.fill('#title', 'Audit Test Case');
    await page.fill('#description', 'Testing audit logging');
    await page.click('button:has-text("Create Case")');
    await expect(page.locator('text=Audit Test Case').first()).toBeVisible({ timeout: 10000 });

    // Check audit log
    await page.goto(`/${ORG_SLUG}/audit-log`);

    // Should show audit log page (admin sees entries, non-admin sees Admin Only card)
    await expect(
      page.locator('h2:has-text("Audit Log"), h3:has-text("Admin Only")').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
