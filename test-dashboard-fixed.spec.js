import { test, expect } from "@playwright/test";

test.describe("Fixed Dashboard Todo Button Test", () => {
  test("should open todo modal when clicking the single todo button", async ({
    page,
  }) => {
    // Navigate to the actual dashboard
    await page.goto(
      "http://localhost:5000/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    console.log("Dashboard loaded...");

    // Check if there's only one todo button now
    const todoButtons = page.locator(".todo-float-button");
    const buttonCount = await todoButtons.count();
    console.log("Number of todo buttons found:", buttonCount);

    // Should have only one button now
    await expect(todoButtons).toHaveCount(1);
    console.log("✅ Only one todo button found (duplicate removed)");

    // Check if the button is visible
    await expect(todoButtons.first()).toBeVisible();
    console.log("Todo button is visible");

    // Check if modal is initially hidden
    const modal = page.locator("#todo-modal");

    // Try to check if modal exists, if not, it's ok (will be created on first click)
    const modalExists = (await modal.count()) > 0;
    console.log("Modal exists initially:", modalExists);

    if (modalExists) {
      const isInitiallyHidden = await modal.evaluate(
        (el) => el.style.display === "none"
      );
      console.log("Modal initially hidden:", isInitiallyHidden);
    }

    // Click the todo button
    console.log("Clicking todo button...");
    await todoButtons.first().click();
    await page.waitForTimeout(1000);

    // Check if modal is now visible
    const modalAfterClick = page.locator("#todo-modal");
    await expect(modalAfterClick).toBeVisible();

    const isModalVisible = await modalAfterClick.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

    console.log("Modal visible after button click:", isModalVisible);
    expect(isModalVisible).toBe(true);

    console.log("✅ Todo button works correctly! Modal opens as expected.");

    // Take a screenshot for verification
    await page.screenshot({ path: "dashboard-todo-fixed.png", fullPage: true });
  });
});
