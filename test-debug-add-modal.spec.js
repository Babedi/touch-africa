import { test, expect } from "@playwright/test";

test.describe("Todo Add Modal Debug", () => {
  test("should debug add todo modal functionality", async ({ page }) => {
    // Navigate to the todo modal test page
    await page.goto("http://localhost:5000/frontend/temp/todo-modal.html");
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    // Open the main todo modal
    await page.locator(".todo-float-button").click();
    await expect(page.locator("#todo-modal")).toBeVisible();
    console.log("✅ Main todo modal is visible");

    // Check if Add Todo button exists
    const addTodoBtn = page.locator("#add-todo-btn");
    const addBtnExists = (await addTodoBtn.count()) > 0;
    console.log("Add Todo button exists:", addBtnExists);

    if (addBtnExists) {
      await expect(addTodoBtn).toBeVisible();
      console.log("✅ Add Todo button is visible");

      // Click the Add Todo button
      await addTodoBtn.click();
      await page.waitForTimeout(1000);

      // Check add todo modal display style
      const addModalDisplay = await page
        .locator("#add-todo-modal")
        .evaluate((el) => {
          return window.getComputedStyle(el).display;
        });
      console.log("Add modal display style:", addModalDisplay);

      // Check if modal is visible
      const addModalVisible = await page.locator("#add-todo-modal").isVisible();
      console.log("Add modal visible:", addModalVisible);

      // Check showAddTodoModal function directly
      const showModalResult = await page.evaluate(() => {
        if (
          window.todoModal &&
          typeof window.todoModal.showAddTodoModal === "function"
        ) {
          window.todoModal.showAddTodoModal();
          return "Function called successfully";
        } else {
          return "Function not available";
        }
      });
      console.log("showAddTodoModal result:", showModalResult);

      await page.waitForTimeout(1000);

      // Check again after direct function call
      const addModalVisibleAfter = await page
        .locator("#add-todo-modal")
        .isVisible();
      console.log("Add modal visible after direct call:", addModalVisibleAfter);
    }

    // Take a screenshot
    await page.screenshot({ path: "add-modal-debug.png", fullPage: true });
  });
});
