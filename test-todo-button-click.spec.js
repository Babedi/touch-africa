import { test, expect } from "@playwright/test";

test.describe("Todo Button Click Test", () => {
  test("should open todo modal when todo button is clicked", async ({
    page,
  }) => {
    // Navigate to the todo modal test page
    await page.goto("http://localhost:5000/frontend/temp/todo-modal.html");
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(2000);

    console.log("Page loaded, looking for todo button...");

    // Check if todo button exists
    const todoButton = page.locator(".todo-float-button");
    await expect(todoButton).toBeVisible();
    console.log("Todo button found and visible");

    // Check if modal is initially hidden
    const modal = page.locator("#todo-modal");
    const isInitiallyHidden = await modal.evaluate(
      (el) => el.style.display === "none"
    );
    console.log("Modal initially hidden:", isInitiallyHidden);

    // Click the todo button
    console.log("Clicking todo button...");
    await todoButton.click();
    await page.waitForTimeout(500);

    // Check if modal is now visible
    const isModalVisible = await modal.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return (
        computedStyle.display !== "none" &&
        computedStyle.visibility !== "hidden"
      );
    });

    console.log("Modal visible after click:", isModalVisible);

    // Take a screenshot to see what's happening
    await page.screenshot({ path: "todo-button-test.png", fullPage: true });

    // Verify modal is visible
    if (!isModalVisible) {
      console.log("Modal is not visible. Checking for any errors...");

      // Log any console errors
      const consoleMessages = [];
      page.on("console", (msg) => consoleMessages.push(msg.text()));
      await page.waitForTimeout(100);
      console.log("Console messages:", consoleMessages);
    }

    expect(isModalVisible).toBe(true);
  });
});
