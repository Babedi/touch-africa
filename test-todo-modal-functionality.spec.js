import { test, expect } from "@playwright/test";

test.describe("Todo Modal Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page
    await page.goto(
      "file:///c:/Users/Development/Desktop/New%20TouchAfrica/test-todo-modal.html"
    );
    await page.waitForLoadState("networkidle");
  });

  test("should load TodoModal class and initialize correctly", async ({
    page,
  }) => {
    // Wait for test results to be populated
    await page.waitForTimeout(1000);

    // Check test results
    const testResults = await page.locator("#testResults li").allTextContents();

    // Verify TodoModal class loaded
    expect(
      testResults.some((result) =>
        result.includes("✅ TodoModal class loaded successfully")
      )
    ).toBeTruthy();

    // Verify instance created
    expect(
      testResults.some((result) =>
        result.includes("✅ TodoModal instance created successfully")
      )
    ).toBeTruthy();

    // Verify click handler attached
    expect(
      testResults.some((result) =>
        result.includes("✅ Click handler attached to Todo button")
      )
    ).toBeTruthy();
  });

  test("should display floating Todo button", async ({ page }) => {
    // Check if Todo button exists and is visible
    const todoButton = page.locator(".todo-float-button");
    await expect(todoButton).toBeVisible();
    await expect(todoButton).toHaveText("Todo");

    // Check button styling
    await expect(todoButton).toHaveCSS("position", "fixed");
    await expect(todoButton).toHaveCSS("border-radius", "50%");
  });

  test("should open Todo modal when button is clicked", async ({ page }) => {
    // Click the Todo button
    const todoButton = page.locator(".todo-float-button");
    await todoButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(500);

    // Check if modal is visible
    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Check modal title
    const modalTitle = page.locator(".todo-modal-title");
    await expect(modalTitle).toHaveText("Todo List");

    // Check if sample todos are loaded
    const todoItems = page.locator(".todo-item");
    expect(await todoItems.count()).toBeGreaterThan(0);
  });

  test("should allow modal to be moved by dragging header", async ({
    page,
  }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Get initial position
    const initialBox = await modal.boundingBox();

    // Drag modal header to move it
    const header = page.locator(".todo-modal-header");
    await header.dragTo(page.locator("body"), {
      targetPosition: { x: 200, y: 200 },
    });

    await page.waitForTimeout(500);

    // Get new position
    const newBox = await modal.boundingBox();

    // Verify modal has moved
    expect(newBox.x).not.toBe(initialBox.x);
    expect(newBox.y).not.toBe(initialBox.y);
  });

  test("should close modal when close button is clicked", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Click close button
    const closeButton = page.locator(".btn-icon").filter({ hasText: "×" });
    await closeButton.click();

    // Wait for modal to disappear
    await page.waitForTimeout(500);

    // Check if modal is hidden
    await expect(modal).not.toBeVisible();
  });

  test("should filter todos by status", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Get initial todo count
    const allTodos = page.locator(".todo-item");
    const initialCount = await allTodos.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click "Completed" filter
    const completedFilter = page
      .locator(".filter-btn")
      .filter({ hasText: "Completed" });
    await completedFilter.click();

    await page.waitForTimeout(300);

    // Check that only completed todos are shown
    const visibleTodos = page.locator(".todo-item:visible");
    const completedCount = await visibleTodos.count();

    // Should have fewer visible todos when filtered
    expect(completedCount).toBeLessThanOrEqual(initialCount);

    // Check if completed todos have the completed class
    if (completedCount > 0) {
      const firstCompletedTodo = visibleTodos.first();
      await expect(firstCompletedTodo).toHaveClass(/completed/);
    }
  });

  test("should filter todos by priority", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Click "High Priority" filter
    const highPriorityFilter = page
      .locator(".filter-btn")
      .filter({ hasText: "High Priority" });
    await highPriorityFilter.click();

    await page.waitForTimeout(300);

    // Check that only high priority todos are shown
    const visibleTodos = page.locator(".todo-item:visible");
    const highPriorityCount = await visibleTodos.count();

    if (highPriorityCount > 0) {
      // Check if visible todos have high priority
      const priorityBadges = page.locator(
        ".todo-item:visible .todo-priority.high"
      );
      expect(await priorityBadges.count()).toBe(highPriorityCount);
    }
  });

  test("should toggle todo completion status", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Find the first todo checkbox
    const firstCheckbox = page.locator(".todo-checkbox").first();
    const firstTodoItem = page.locator(".todo-item").first();

    // Get initial completion state
    const initialChecked = await firstCheckbox.isChecked();
    const initialClasses = await firstTodoItem.getAttribute("class");

    // Click the checkbox
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // Verify state changed
    const newChecked = await firstCheckbox.isChecked();
    const newClasses = await firstTodoItem.getAttribute("class");

    expect(newChecked).not.toBe(initialChecked);
    expect(newClasses).not.toBe(initialClasses);
  });

  test("should display todo statistics correctly", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Check todo count display
    const todoCount = page.locator(".todo-count");
    await expect(todoCount).toBeVisible();

    const todoCompleted = page.locator(".todo-completed");
    await expect(todoCompleted).toBeVisible();

    // Verify count text format
    const countText = await todoCount.textContent();
    expect(countText).toMatch(/Total: \d+/);

    const completedText = await todoCompleted.textContent();
    expect(completedText).toMatch(/Completed: \d+/);
  });

  test("should handle resize and maintain functionality", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    const modal = page.locator(".todo-modal");
    await expect(modal).toBeVisible();

    // Verify modal is resizable (has resize CSS property)
    const resizeProperty = await modal.evaluate(
      (el) => window.getComputedStyle(el).resize
    );
    expect(resizeProperty).toBe("both");

    // Verify minimum dimensions are enforced
    const minWidth = await modal.evaluate(
      (el) => window.getComputedStyle(el).minWidth
    );
    expect(minWidth).toBe("400px");

    const minHeight = await modal.evaluate(
      (el) => window.getComputedStyle(el).minHeight
    );
    expect(minHeight).toBe("300px");
  });

  test("should persist todo state in localStorage", async ({ page }) => {
    // Open modal
    await page.locator(".todo-float-button").click();
    await page.waitForTimeout(500);

    // Toggle a todo
    const firstCheckbox = page.locator(".todo-checkbox").first();
    await firstCheckbox.click();
    await page.waitForTimeout(300);

    // Check localStorage
    const todoData = await page.evaluate(() => {
      return localStorage.getItem("touchafrica_todos");
    });

    expect(todoData).toBeTruthy();

    // Parse and verify data structure
    const parsedData = JSON.parse(todoData);
    expect(Array.isArray(parsedData)).toBeTruthy();
    expect(parsedData.length).toBeGreaterThan(0);

    // Verify todo structure
    const firstTodo = parsedData[0];
    expect(firstTodo).toHaveProperty("id");
    expect(firstTodo).toHaveProperty("title");
    expect(firstTodo).toHaveProperty("completed");
    expect(firstTodo).toHaveProperty("priority");
  });
});
