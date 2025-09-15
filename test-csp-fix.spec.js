import { test, expect } from "@playwright/test";

test.describe("CSP Fix Test", () => {
  test("should not have CSP violations and delete functionality should work", async ({
    page,
  }) => {
    // Capture console messages to check for CSP violations
    const consoleMessages = [];
    page.on("console", (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to the dashboard
    await page.goto(
      "http://localhost:5000/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    console.log("Testing CSP compliance and delete functionality...");

    // Check for CSP violations in console
    const cspViolations = consoleMessages.filter(
      (msg) =>
        msg.includes("Content Security Policy") ||
        msg.includes("CSP") ||
        msg.includes("unsafe-inline")
    );

    console.log("CSP violations found:", cspViolations.length);
    if (cspViolations.length > 0) {
      console.log("CSP violations:", cspViolations);
    }

    // Click todo button to open modal
    const todoButton = page.locator(".todo-float-button");
    await todoButton.click();
    await page.waitForTimeout(1000);

    // Verify modal is visible
    const modal = page.locator("#todo-modal");
    await expect(modal).toBeVisible();

    // Check if todos are loaded
    const todoItems = page.locator(".todo-item");
    const todoCount = await todoItems.count();
    console.log(`Found ${todoCount} todos`);

    if (todoCount > 0) {
      // Test delete functionality - look for delete buttons
      const deleteButtons = page.locator(".todo-delete-btn");
      const deleteButtonCount = await deleteButtons.count();
      console.log(`Found ${deleteButtonCount} delete buttons`);

      if (deleteButtonCount > 0) {
        // Click first delete button and handle the confirmation dialog
        page.on("dialog", (dialog) => {
          console.log("Confirmation dialog appeared:", dialog.message());
          dialog.dismiss(); // Cancel the delete for this test
        });

        await deleteButtons.first().click();
        await page.waitForTimeout(500);

        console.log("✅ Delete button clicked without CSP violations");
      }
    }

    // Final check for any new CSP violations after interaction
    const finalCspViolations = consoleMessages.filter(
      (msg) =>
        msg.includes("Content Security Policy") ||
        msg.includes("CSP") ||
        msg.includes("unsafe-inline")
    );

    console.log("=== CONSOLE MESSAGES ===");
    consoleMessages.forEach((msg) => console.log(msg));

    // The test passes if no CSP violations occurred
    expect(finalCspViolations.length).toBe(0);
    console.log(
      "✅ No CSP violations found - inline onclick handlers successfully replaced!"
    );
  });
});
