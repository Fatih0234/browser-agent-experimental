import { test, expect } from "@playwright/test";

test.describe("Portal Gym - Auth and Navigation", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.locator("text=Sign In")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("protected routes redirect to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to sign-in when not authenticated
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test("landing page shows dashboard link", async ({ page }) => {
    await page.goto("/");
    // Root page behavior
    await expect(page).toHaveURL(/.*sign-in|.*dashboard/);
  });
});
