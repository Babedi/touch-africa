import { test, expect } from "@playwright/test";

test.describe("Todo Form Submission Debug", () => {
  test("should debug form submission", async ({ page }) => {
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

    // Navigate to the todo modal test page
    await page.goto("http://localhost:5000/frontend/temp/todo-modal.html");
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    // Open the main todo modal
    await page.locator(".todo-float-button").click();
    await expect(page.locator("#todo-modal")).toBeVisible();

    // Click Add Todo button
    await page.locator("#add-todo-btn").click();
    await expect(page.locator("#add-todo-modal")).toBeVisible();

    // Fill in a simple todo
    await page.fill("#todo-title", "Test Todo");
    await page.fill("#todo-description", "Test Description");
    await page.selectOption("#todo-priority", "medium");

    console.log("Form filled, about to submit...");

    // Submit the form
    await page.click('button[type="submit"][form="add-todo-form"]');

    // Wait and check what happens
    await page.waitForTimeout(3000);

    // Check modal visibility
    const modalVisible = await page.locator("#add-todo-modal").isVisible();
    console.log("Modal still visible after form submission:", modalVisible);

    // Print all collected messages
    console.log("\n--- All Console Messages ---");
    consoleMessages.forEach((msg) => console.log(msg));
    console.log("\n--- All Page Errors ---");
    pageErrors.forEach((error) => console.log(error));

    // Check if any todos were created
    const todoCount = await page.locator(".todo-item").count();
    console.log("Number of todos after submission:", todoCount);
  });
});
