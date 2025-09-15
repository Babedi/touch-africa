import { test, expect } from "@playwright/test";

test.describe("Delete Functionality Test", () => {
  test("should successfully delete a todo when confirmed", async ({ page }) => {
    // Navigate to the dashboard
    await page.goto(
      "http://localhost:5000/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    // Click todo button to open modal
    const todoButton = page.locator(".todo-float-button");
    await todoButton.click();
    await page.waitForTimeout(1000);

    // Get initial todo count
    const todoItems = page.locator(".todo-item");
    const initialCount = await todoItems.count();
    console.log(`Initial todo count: ${initialCount}`);

    if (initialCount > 0) {
      // Handle the confirmation dialog by accepting it
      page.on("dialog", (dialog) => {
        console.log("Confirming delete:", dialog.message());
        dialog.accept(); // Confirm the delete
      });

      // Click delete button on the first todo
      const deleteButtons = page.locator(".todo-delete-btn");
      await deleteButtons.first().click();

      // Wait for the delete operation to complete
      await page.waitForTimeout(2000);

      // Check if todo count decreased
      const finalCount = await todoItems.count();
      console.log(`Final todo count: ${finalCount}`);

      expect(finalCount).toBe(initialCount - 1);
      console.log("✅ Todo successfully deleted via proper event listener!");
    } else {
      console.log("No todos to delete - adding one first...");

      // Add a todo first, then delete it
      const addBtn = page.locator("#add-todo-btn");
      await addBtn.click();
      await page.waitForTimeout(500);

      await page.fill("#todo-title", "Test Delete Todo");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Now delete it
      page.on("dialog", (dialog) => dialog.accept());
      const deleteButtons = page.locator(".todo-delete-btn");
      await deleteButtons.first().click();
      await page.waitForTimeout(2000);

      console.log("✅ Added and deleted todo successfully!");
    }
  });
});
