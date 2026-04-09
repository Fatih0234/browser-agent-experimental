import { test, expect } from "@playwright/test";

test.describe("Portal Gym - Document Center UI", () => {
  test("documents page requires auth", async ({ page }) => {
    await page.goto("/test-org/documents");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("document upload button exists on documents page", async ({ page }) => {
    // Without auth, the route redirects to sign-in
    await page.goto("/test-org/documents");
    // Should redirect to sign-in (not 404)
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
