import { test, expect } from "@playwright/test";

test.describe("Todo API Integration Test", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the todo modal test page served by the backend
    await page.goto("http://localhost:5000/frontend/temp/todo-modal.html");
    await page.waitForLoadState("networkidle");

    // Wait for the modal to initialize
    await page.waitForTimeout(2000);
  });

  test("should create new todos via the API", async ({ page }) => {
    // Open the todo modal by clicking the floating button
    const todoButton = page.locator(".todo-float-button");
    await expect(todoButton).toBeVisible();
    await todoButton.click();

    // Wait for modal to appear
    const todoModal = page.locator("#todo-modal");
    await expect(todoModal).toBeVisible();

    // Click Add Todo button
    const addTodoBtn = page.locator("#add-todo-btn");
    await addTodoBtn.click();

    // Wait for add todo modal to appear
    const addTodoModal = page.locator("#add-todo-modal");
    await expect(addTodoModal).toBeVisible();

    // Sample todos to create
    const sampleTodos = [
      {
        title: "Complete dashboard redesign",
        description:
          "Redesign the admin dashboard with new layout and components",
        priority: "high",
      },
      {
        title: "Fix authentication bug",
        description: "Resolve login issues affecting multiple users",
        priority: "high",
      },
      {
        title: "Update user documentation",
        description: "Add new feature documentation to user guide",
        priority: "medium",
      },
      {
        title: "Setup automated testing",
        description: "Configure CI/CD pipeline with automated tests",
        priority: "high",
      },
      {
        title: "Optimize database queries",
        description: "Improve performance of slow running queries",
        priority: "medium",
      },
    ];

    // Create each todo
    for (const todo of sampleTodos) {
      // Fill in the form
      await page.fill("#todo-title", todo.title);
      await page.fill("#todo-description", todo.description);
      await page.selectOption("#todo-priority", todo.priority);

      // Submit the form
      await page.click('button[type="submit"][form="add-todo-form"]');

      // Wait for the modal to close and todo to be added
      await page.waitForTimeout(2000);
      await expect(addTodoModal).not.toBeVisible();

      // Reopen the add todo modal for the next todo
      if (sampleTodos.indexOf(todo) < sampleTodos.length - 1) {
        await addTodoBtn.click();
        await expect(addTodoModal).toBeVisible();
      }
    }

    // Verify todos were created by checking the todo list
    const todoItems = page.locator(".todo-item");
    await expect(todoItems).toHaveCount(sampleTodos.length);

    // Check if the todos appear in the list
    for (const todo of sampleTodos) {
      await expect(
        page.locator(".todo-title").filter({ hasText: todo.title })
      ).toBeVisible();
    }

    console.log(
      `✅ Successfully created ${sampleTodos.length} todos via the API`
    );
  });

  test("should toggle todo completion status", async ({ page }) => {
    // Open the todo modal
    await page.locator(".todo-float-button").click();
    await expect(page.locator("#todo-modal")).toBeVisible();

    // Wait for todos to load
    await page.waitForTimeout(1000);

    // Find the first todo checkbox and click it
    const firstCheckbox = page.locator(".todo-checkbox").first();
    if ((await firstCheckbox.count()) > 0) {
      await firstCheckbox.click();

      // Wait for the API call to complete
      await page.waitForTimeout(1000);

      // Verify the todo item has the completed class
      const todoItem = page.locator(".todo-item").first();
      await expect(todoItem).toHaveClass(/completed/);

      console.log("✅ Successfully toggled todo completion status");
    } else {
      console.log("ℹ️ No todos found to toggle");
    }
  });

  test("should delete a todo", async ({ page }) => {
    // Open the todo modal
    await page.locator(".todo-float-button").click();
    await expect(page.locator("#todo-modal")).toBeVisible();

    // Wait for todos to load
    await page.waitForTimeout(1000);

    // Count initial todos
    const initialCount = await page.locator(".todo-item").count();

    if (initialCount > 0) {
      // Find and click the first delete button
      const deleteButton = page.locator(".todo-btn-danger").first();
      await deleteButton.click();

      // Confirm deletion in the alert dialog
      page.on("dialog", (dialog) => dialog.accept());

      // Wait for the API call to complete
      await page.waitForTimeout(1000);

      // Verify the todo was deleted
      const finalCount = await page.locator(".todo-item").count();
      expect(finalCount).toBe(initialCount - 1);

      console.log("✅ Successfully deleted a todo");
    } else {
      console.log("ℹ️ No todos found to delete");
    }
  });
});
