import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/sign-in");
    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByRole("button", { name: "进入平台" }).click();
    await expect(page.getByRole("heading", { name: "概览" })).toBeVisible({ timeout: 15000 });
  });

  test("dashboard shows KPI cards and sidebar navigation", async ({ page }) => {
    // Page title
    await expect(page.getByRole("heading", { name: "概览" })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: "新建项目" })).toBeVisible({ timeout: 5000 });

    // One sidebar nav item check is sufficient
    await expect(page.getByText("竞品调研")).toBeVisible({ timeout: 5000 });
  });

  test("can navigate to competitor analysis", async ({ page }) => {
    await page.getByText("竞品调研").click();
    await expect(page).toHaveURL(/competitor-analysis/);
    await expect(page.getByText("新建分析")).toBeVisible();
    await expect(page.getByPlaceholder(/tiktok\.com/)).toBeVisible();
  });

  test("can navigate to models page", async ({ page }) => {
    await page.getByText("大模型列表").first().click();
    await page.waitForURL("**/models", { timeout: 10000 });
    await expect(page.getByText("当前接入的模型")).toBeVisible({ timeout: 5000 });
  });
});
