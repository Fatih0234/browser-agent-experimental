import { test, expect } from '@playwright/test';

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
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Should show org selector (combobox with org name)
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

test.describe('Portal Gym - Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should show empty state when no cases exist', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);
    
    await expect(page.locator('text=No cases yet')).toBeVisible();
    await expect(page.locator('button:has-text("New Case")')).toBeVisible();
  });

  test('should create a new case', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);
    
    // Click new case button
    await page.click('button:has-text("New Case")');
    
    // Fill form in dialog
    await page.fill('input[name="title"]', 'E2E Test Case');
    await page.fill('textarea[name="description"]', 'Created by Playwright E2E test');
    await page.selectOption('select[name="case_type"]', 'general');
    await page.selectOption('select[name="priority"]', 'medium');
    
    // Submit
    await page.click('button:has-text("Create Case")');
    
    // Should show success and list the case
    await expect(page.locator('text=E2E Test Case')).toBeVisible();
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
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should show empty state when no documents exist', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);
    
    await expect(page.locator('text=No documents yet')).toBeVisible();
    await expect(page.locator('button:has-text("Upload Document")')).toBeVisible();
  });

  test('should upload a document', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/documents`);
    
    // Click upload button
    await page.click('button:has-text("Upload Document")');
    
    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Fake PDF content for testing')
    });
    
    // Fill document name
    await page.fill('input[name="name"]', 'Test PDF Document');
    
    // Submit
    await page.click('button:has-text("Upload")');
    
    // Should appear in list
    await expect(page.locator('text=Test PDF Document')).toBeVisible();
  });
});

test.describe('Portal Gym - Admin Seed/Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
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
    page.on('dialog', dialog => dialog.accept());
    
    // Wait for seeding to complete
    await expect(page.locator('text=Seeded')).toBeVisible({ timeout: 30000 });
    
    // Verify cases were created
    await page.goto(`/${ORG_SLUG}/cases`);
    await expect(page.locator('text=No cases yet')).not.toBeVisible();
  });

  test('should reset scenario data safely', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/admin/seed`);
    
    // Find and click reset button for a completed run
    const resetButton = page.locator('button:has-text("Reset")').first();
    if (await resetButton.isVisible()) {
      await resetButton.click();
      
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Should show success
      await expect(page.locator('text=reset successfully')).toBeVisible();
    }
  });
});

test.describe('Portal Gym - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should navigate between all main pages', async ({ page }) => {
    const pages = [
      { name: 'Cases', path: `/${ORG_SLUG}/cases` },
      { name: 'Documents', path: `/${ORG_SLUG}/documents` },
      { name: 'Notifications', path: `/${ORG_SLUG}/notifications` },
      { name: 'Audit Log', path: `/${ORG_SLUG}/audit-log` },
      { name: 'Admin', path: `/${ORG_SLUG}/admin/seed` },
    ];

    for (const nav of pages) {
      await page.goto(nav.path);
      await expect(page.locator(`text=${nav.name}`).first()).toBeVisible();
    }
  });

  test('should show org switcher with correct org', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/cases`);
    
    // Org selector should show current org
    await expect(page.locator('text=Demo Organization')).toBeVisible();
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
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should display audit log entries', async ({ page }) => {
    await page.goto(`/${ORG_SLUG}/audit-log`);
    
    // Should show audit log heading
    await expect(page.locator('text=Audit Log')).toBeVisible();
    
    // Table or list should be present
    await expect(page.locator('table, [role="list"]').first()).toBeVisible();
  });

  test('should log case creation events', async ({ page }) => {
    // Create a case first
    await page.goto(`/${ORG_SLUG}/cases`);
    await page.click('button:has-text("New Case")');
    await page.fill('input[name="title"]', 'Audit Test Case');
    await page.fill('textarea[name="description"]', 'Testing audit logging');
    await page.click('button:has-text("Create Case")');
    
    // Check audit log
    await page.goto(`/${ORG_SLUG}/audit-log`);
    
    // Should show case creation event
    await expect(page.locator('text=case_created, text=Audit Test Case').first()).toBeVisible();
  });
});
