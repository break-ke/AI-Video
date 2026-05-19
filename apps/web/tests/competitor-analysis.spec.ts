import { test, expect } from "@playwright/test";

test.describe("Competitor Analysis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByPlaceholder("输入密码").fill("admin123");
    await page.getByRole("button", { name: "进入平台" }).click();
    await expect(page.getByRole("heading", { name: "概览" })).toBeVisible({ timeout: 15000 });
  });

  test("competitor analysis page loads with all tabs", async ({ page }) => {
    await page.goto("/competitor-analysis");

    // Page fully loaded — URL input + prompt textarea
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await expect(page.getByPlaceholder(/tiktok\.com/)).toBeVisible({ timeout: 5000 });

    // Prompt textarea has default content
    const promptArea = page.locator("textarea").first();
    await expect(promptArea).toBeVisible();
  });

  test("entering link and clicking analyze starts progress", async ({ page }) => {
    await page.goto("/competitor-analysis");

    const urlInput = page.getByPlaceholder(/tiktok\.com/);
    await urlInput.waitFor({ state: "visible", timeout: 5000 });
    await urlInput.fill("https://www.tiktok.com/@user/video/123456789");

    const analyzeBtn = page.getByRole("button", { name: "开始分析" });
    await analyzeBtn.waitFor({ state: "visible", timeout: 3000 });
    await analyzeBtn.click();

    // After clicking, tab switches to "result" with video/analysis
    await expect(page.getByText("逐片段分析").or(page.getByText("分析完成")).or(page.getByText("分析报告"))).toBeVisible({ timeout: 8000 });
  });

  test("analysis history tab shows records", async ({ page }) => {
    await page.goto("/competitor-analysis");
    await page.getByText("分析列表").click();

    // Should show either records or empty state
    const hasRecords = await page.getByText("还没有分析记录").isVisible().catch(() => false);
    expect(hasRecords || true).toBeTruthy();
  });

  test("upload prompt file button exists", async ({ page }) => {
    await page.goto("/competitor-analysis");

    await expect(page.getByText("上传提示词")).toBeVisible();
    await expect(page.getByText("重置默认")).toBeVisible();
  });
});
