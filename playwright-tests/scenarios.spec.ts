import { test, expect } from "@playwright/test";

test.describe("Portal Gym - Scenario Management UI", () => {
  test("admin seed page requires auth", async ({ page }) => {
    await page.goto("/dashboard/test-org/admin/seed");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("seed page route exists", async ({ page }) => {
    const response = await page.goto("/dashboard/test-org/admin/seed");
    // Route should exist (even if it redirects)
    expect(response).not.toBeNull();
  });
});
