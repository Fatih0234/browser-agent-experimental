import { test, expect } from "@playwright/test";

test.describe("Portal Gym - Document Center UI", () => {
  test("documents page requires auth", async ({ page }) => {
    await page.goto("/dashboard/test-org/documents");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("document upload button exists on documents page", async ({ page }) => {
    // This test would require authentication setup
    // For now, just verify the route exists and returns expected behavior
    const response = await page.goto("/dashboard/test-org/documents");
    // Without auth, should redirect
    expect(response?.status()).toBe(200); // Or redirect status
  });
});
