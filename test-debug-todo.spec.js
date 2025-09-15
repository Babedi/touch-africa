import { test, expect } from "@playwright/test";

test.describe("Todo Modal Debug", () => {
  test("should load and show basic functionality", async ({ page }) => {
    // Navigate to the todo modal test page
    await page.goto("http://localhost:5000/frontend/temp/todo-modal.html");
    await page.waitForLoadState("networkidle");

    // Collect console messages and errors
    const consoleMessages = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log("PAGE LOG:", msg.text());
    });

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
      console.log("PAGE ERROR:", error.message);
    });

    // Wait a bit more for initialization
    await page.waitForTimeout(3000);

    // Print all collected messages
    console.log("\n--- All Console Messages ---");
    consoleMessages.forEach((msg) => console.log(msg));
    console.log("\n--- All Page Errors ---");
    pageErrors.forEach((error) => console.log(error));

    // Check if the floating button exists
    const floatingButton = page.locator(".todo-float-button");
    await expect(floatingButton).toBeVisible();
    console.log("✅ Floating button is visible");

    // Check if TodoModal window object exists
    const todoModalExists = await page.evaluate(() => {
      return typeof window.todoModal !== "undefined";
    });
    console.log("TodoModal exists:", todoModalExists);

    // Check if TouchAfricaApiClient exists
    const apiClientExists = await page.evaluate(() => {
      return typeof window.TouchAfricaApiClient !== "undefined";
    });
    console.log("TouchAfricaApiClient exists:", apiClientExists);

    // Try to manually create a TodoModal instance
    const modalInstanceCreated = await page.evaluate(() => {
      try {
        console.log("Attempting to create TodoModal instance...");
        window.todoModal = new TodoModal();
        console.log("TodoModal instance created successfully");
        return true;
      } catch (error) {
        console.log("Error creating TodoModal instance:", error.message);
        console.log("Error stack:", error.stack);
        return false;
      }
    });
    console.log("TodoModal instance created:", modalInstanceCreated);

    // Check if DOM is ready
    const domReady = await page.evaluate(() => {
      return document.readyState === "complete";
    });
    console.log("DOM ready:", domReady);

    // Try to click the button and see what happens
    await floatingButton.click();
    await page.waitForTimeout(1000);

    // Check if modal is visible now
    const modalVisible = await page.locator("#todo-modal").isVisible();
    console.log("Modal visible after click:", modalVisible);

    // Check modal display style
    const modalDisplay = await page.locator("#todo-modal").evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    console.log("Modal display style:", modalDisplay);

    // Take a screenshot for debugging
    await page.screenshot({ path: "todo-modal-debug.png", fullPage: true });
  });
});
