import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("sign-in page loads with branding", async ({ page }) => {
    await page.goto("/sign-in");

    // Branding — VideoForge is split across elements (Video + Forge styled differently)
    await expect(page.getByText("AI 驱动的视频营销内容生产平台")).toBeVisible();
    await expect(page.getByPlaceholder("输入密码")).toBeVisible();
    await expect(page.getByRole("button", { name: "进入平台" })).toBeVisible();

    // Background decoration
    await expect(page.locator(".fixed.inset-0")).toBeVisible();
  });

  test("login with correct password redirects to dashboard", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByRole("button", { name: "进入平台" }).click();

    await page.waitForURL("**/", { timeout: 15000 });
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByPlaceholder("输入密码").fill("wrongpassword");
    await page.getByRole("button", { name: "进入平台" }).click();

    await expect(page.getByText("密码错误")).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user redirected to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/sign-in/);
  });
});
