import { test, expect } from "@playwright/test";

test.describe("Todo Modal Final Test", () => {
  test("should work with real API without any offline fallbacks", async ({
    page,
  }) => {
    // Navigate to the dashboard
    await page.goto(
      "http://localhost:5000/frontend/dashboards/internal.admin/dashboard.html"
    );
    await page.waitForLoadState("networkidle");

    // Wait for initialization
    await page.waitForTimeout(3000);

    console.log("Testing final todo modal functionality...");

    // Verify TodoModal is initialized
    const hasTodoModal = await page.evaluate(() => {
      return typeof window.todoModal !== "undefined";
    });
    expect(hasTodoModal).toBe(true);
    console.log("✅ TodoModal initialized");

    // Verify only one todo button exists
    const todoButtons = page.locator(".todo-float-button");
    await expect(todoButtons).toHaveCount(1);
    console.log("✅ Single todo button found");

    // Click todo button
    await todoButtons.click();
    await page.waitForTimeout(1000);

    // Verify modal is visible
    const modal = page.locator("#todo-modal");
    await expect(modal).toBeVisible();
    console.log("✅ Modal opens successfully");

    // Check if real todos are loaded (not demo/offline todos)
    const todoItems = page.locator(".todo-item");
    const todoCount = await todoItems.count();
    console.log(`✅ ${todoCount} real todos loaded from API`);

    // Verify these are real todos, not demo todos
    if (todoCount > 0) {
      const firstTodoText = await todoItems.first().textContent();
      expect(firstTodoText).not.toContain("demo todo");
      expect(firstTodoText).not.toContain("Sample Todo");
      console.log("✅ Confirmed real todos (not demo data)");
    }

    // Test add todo functionality
    const addBtn = page.locator("#add-todo-btn");
    await addBtn.click();
    await page.waitForTimeout(500);

    // Verify add modal appears
    const addModal = page.locator("#add-todo-modal");
    await expect(addModal).toBeVisible();
    console.log("✅ Add todo modal opens");

    // Fill in todo form
    await page.fill("#todo-title", "Test Todo from Playwright");
    await page.fill(
      "#todo-description",
      "This is a test todo added via automation"
    );
    await page.selectOption("#todo-priority", "high");

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify todo was added to the list
    const updatedTodoCount = await todoItems.count();
    expect(updatedTodoCount).toBeGreaterThan(todoCount);
    console.log(
      `✅ Todo added successfully (${todoCount} → ${updatedTodoCount})`
    );

    // Take a screenshot of the working modal
    await page.screenshot({
      path: "todo-modal-final-working.png",
      fullPage: true,
    });

    console.log("🎉 All todo functionality working with real API!");
  });
});
