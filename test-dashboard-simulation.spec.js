import { test, expect } from "@playwright/test";

test.describe("Dashboard Simulation Test", () => {
  test("should open todo modal when clicking any todo button in dashboard layout", async ({
    page,
  }) => {
    // Navigate to the dashboard simulation
    await page.goto("http://localhost:5000/test-dashboard-simulation.html");
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(2000);

    console.log("Dashboard simulation loaded...");

    // Check if both todo buttons exist
    const todoButtons = page.locator(".todo-float-button");
    await expect(todoButtons).toHaveCount(2);
    console.log("Found 2 todo buttons (main + dashboard page)");

    // Get specific buttons
    const mainTodoBtn = page.locator("#main-todo-btn");
    const dashboardTodoBtn = page.locator("#todo-float-btn");

    await expect(mainTodoBtn).toBeVisible();
    await expect(dashboardTodoBtn).toBeVisible();
    console.log("Both buttons are visible");

    // Check if modal is initially hidden
    const modal = page.locator("#todo-modal");

    // Test main todo button
    console.log("Testing main todo button...");
    await mainTodoBtn.click();
    await page.waitForTimeout(500);

    const isModalVisibleAfterMain = await modal.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    console.log(
      "Modal visible after main button click:",
      isModalVisibleAfterMain
    );
    expect(isModalVisibleAfterMain).toBe(true);

    // Hide modal
    await modal.evaluate((el) => (el.style.display = "none"));

    // Test dashboard page todo button
    console.log("Testing dashboard page todo button...");
    await dashboardTodoBtn.click();
    await page.waitForTimeout(500);

    const isModalVisibleAfterDashboard = await modal.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    console.log(
      "Modal visible after dashboard button click:",
      isModalVisibleAfterDashboard
    );
    expect(isModalVisibleAfterDashboard).toBe(true);

    console.log("✅ Both todo buttons work correctly in dashboard layout!");
  });
});
