import { test, expect } from "@playwright/test";

test.describe("Todo API Connection Test", () => {
  test("should connect to real API and load todos", async ({ page }) => {
    // Capture console messages
    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Navigate to the dashboard
    await page.goto(
      "http://localhost:5000/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    console.log("=== CONSOLE MESSAGES ===");
    consoleMessages.forEach((msg) => console.log(msg));

    console.log("=== PAGE ERRORS ===");
    pageErrors.forEach((error) => console.log("ERROR:", error));

    // Check if TouchAfricaApiClient is available
    const hasApiClient = await page.evaluate(() => {
      return typeof window.TouchAfricaApiClient !== "undefined";
    });
    console.log("TouchAfricaApiClient available:", hasApiClient);

    // Check if TodoModal is available
    const hasTodoModal = await page.evaluate(() => {
      return typeof window.todoModal !== "undefined";
    });
    console.log("TodoModal instance available:", hasTodoModal);

    if (hasTodoModal) {
      // Test clicking the todo button
      const todoButton = page.locator(".todo-float-button");
      await expect(todoButton).toBeVisible();

      console.log("Clicking todo button...");
      await todoButton.click();
      await page.waitForTimeout(1000);

      // Check if modal is visible
      const modal = page.locator("#todo-modal");
      const isModalVisible = await modal.isVisible();
      console.log("Modal visible after click:", isModalVisible);

      if (isModalVisible) {
        // Check for real todos from API
        const todoItems = page.locator(".todo-item");
        const todoCount = await todoItems.count();
        console.log("Number of todos loaded:", todoCount);

        // Take screenshot for verification
        await page.screenshot({ path: "todo-api-test.png", fullPage: true });
      }
    }
  });
});
