import { test, expect } from "@playwright/test";

test.describe("Dashboard Debug Test", () => {
  test("should debug todo modal initialization in dashboard", async ({
    page,
  }) => {
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
    await page.waitForTimeout(5000);

    console.log("Dashboard loaded, checking for errors...");

    // Log all console messages
    console.log("=== CONSOLE MESSAGES ===");
    consoleMessages.forEach((msg) => console.log(msg));

    // Log any page errors
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

    // Check if todo button exists
    const todoButton = page.locator(".todo-float-button");
    const buttonExists = (await todoButton.count()) > 0;
    console.log("Todo button exists:", buttonExists);

    if (buttonExists) {
      console.log("Attempting to click todo button...");
      await todoButton.click();
      await page.waitForTimeout(2000);

      // Check what happens after click
      const modalAfterClick = await page.locator("#todo-modal").count();
      console.log("Modal element count after click:", modalAfterClick);

      // Check for any new console messages
      console.log("=== CONSOLE MESSAGES AFTER CLICK ===");
      consoleMessages.slice(-10).forEach((msg) => console.log(msg));
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: "dashboard-debug.png", fullPage: true });
  });
});
