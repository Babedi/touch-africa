import { test, expect } from "@playwright/test";

test.describe("Dashboard Todo Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto(
      "file:///c:/Users/Development/Desktop/New%20TouchAfrica/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");
    // Wait for scripts to load
    await page.waitForTimeout(2000);
  });

  test("should display Todo button on dashboard", async ({ page }) => {
    // Check if Todo button exists and is visible
    const todoButton = page.locator(".todo-float-button");
    await expect(todoButton).toBeVisible();
    await expect(todoButton).toHaveText("Todo");

    // Check button positioning
    await expect(todoButton).toHaveCSS("position", "fixed");
    await expect(todoButton).toHaveCSS("bottom", "30px");
    await expect(todoButton).toHaveCSS("right", "30px");
  });

  test("should open Todo modal from dashboard button", async ({ page }) => {
    // Click the Todo button
    const todoButton = page.locator(".todo-float-button");
    await todoButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Check if modal is visible
    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Check modal positioning
    await expect(modal).toHaveCSS("position", "fixed");

    // Check modal content
    const modalTitle = page.locator(".todo-modal-title");
    await expect(modalTitle).toHaveText("Todo List");

    // Check if todos are loaded
    const todoItems = page.locator(".todo-item");
    expect(await todoItems.count()).toBeGreaterThan(0);
  });

  test("should work alongside existing dashboard functionality", async ({
    page,
  }) => {
    // Check that existing dashboard elements are still functional
    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();

    // Check navigation links work
    const navLinks = page.locator(".nav-link");
    expect(await navLinks.count()).toBeGreaterThan(0);

    // Open Todo modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Verify modal is open
    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Check that sidebar is still functional
    await expect(sidebar).toBeVisible();

    // Close modal
    const closeButton = page.locator(".btn-icon").filter({ hasText: "×" });
    await closeButton.click();
    await page.waitForTimeout(500);

    // Verify modal is closed and dashboard is still functional
    await expect(modal).not.toBeVisible();
    await expect(sidebar).toBeVisible();
  });

  test("should maintain Todo state across dashboard navigation", async ({
    page,
  }) => {
    // Open Todo modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Toggle a todo
    const firstCheckbox = page.locator(".todo-checkbox").first();
    const initialChecked = await firstCheckbox.isChecked();
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // Verify state changed
    const newChecked = await firstCheckbox.isChecked();
    expect(newChecked).not.toBe(initialChecked);

    // Close modal
    const closeButton = page.locator(".btn-icon").filter({ hasText: "×" });
    await closeButton.click();
    await page.waitForTimeout(500);

    // Open modal again
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Verify state is preserved
    const checkbox = page.locator(".todo-checkbox").first();
    expect(await checkbox.isChecked()).toBe(newChecked);
  });

  test("should handle multiple modal interactions", async ({ page }) => {
    // Open and close modal multiple times
    for (let i = 0; i < 3; i++) {
      // Open modal
      await page.locator(".todo-float-button").click();
      await page.waitForTimeout(500);

      const modal = page.locator(".todo-modal");
      await expect(modal).toBeVisible();

      // Interact with modal (toggle filter)
      const filters = page.locator(".filter-btn");
      const randomFilter = filters.nth(i % 3);
      await randomFilter.click();
      await page.waitForTimeout(300);

      // Close modal
      const closeButton = page.locator(".btn-icon").filter({ hasText: "×" });
      await closeButton.click();
      await page.waitForTimeout(500);

      await expect(modal).not.toBeVisible();
    }

    // Final open to verify everything still works
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Verify todos are still there
    const todoItems = page.locator(".todo-item");
    expect(await todoItems.count()).toBeGreaterThan(0);
  });

  test("should not interfere with dashboard responsiveness", async ({
    page,
  }) => {
    // Test at different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Check Todo button is visible
      const todoButton = page.locator(".todo-float-button");
      await expect(todoButton).toBeVisible();

      // Check button positioning
      await expect(todoButton).toHaveCSS("position", "fixed");

      // Open modal
      await todoButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator(".todo-modal");
      await expect(modal).toBeVisible();

      // Check modal is within viewport
      const modalBox = await modal.boundingBox();
      expect(modalBox.x).toBeGreaterThanOrEqual(0);
      expect(modalBox.y).toBeGreaterThanOrEqual(0);
      expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(viewport.width);

      // Close modal
      const closeButton = page.locator(".btn-icon").filter({ hasText: "×" });
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });
});
