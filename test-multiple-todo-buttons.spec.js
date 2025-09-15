import { test, expect } from "@playwright/test";

test.describe("Multiple Todo Buttons Test", () => {
  test("should open todo modal when any todo button is clicked", async ({
    page,
  }) => {
    // Create test page with multiple todo buttons
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multiple Todo Buttons Test</title>
        <link rel="stylesheet" href="http://localhost:5000/frontend/temp/todo-styles.css" />
      </head>
      <body>
        <!-- Multiple todo buttons like in the real dashboard -->
        <button class="todo-float-button" id="btn1">Todo Button 1</button>
        <button class="todo-float-button" id="btn2">Todo Button 2</button>
        <button class="todo-float-button" id="btn3">Todo Button 3</button>

        <!-- Todo Modal Container -->
        <div id="todoModalContainer"></div>

        <!-- Load TouchAfricaApiClient first -->
        <script src="http://localhost:5000/frontend/shared/api/touchafrica-api-client.js"></script>
        
        <!-- Load TodoModal as module -->
        <script type="module">
          import TodoModal, { initializeTodoModal } from 'http://localhost:5000/frontend/temp/todo-modal.js';
          
          // Wait for API client to be available
          function waitForApiClient() {
            return new Promise((resolve) => {
              if (window.TouchAfricaApiClient) {
                resolve();
              } else {
                setTimeout(() => waitForApiClient().then(resolve), 100);
              }
            });
          }
          
          waitForApiClient().then(() => {
            initializeTodoModal();
            console.log('TodoModal initialized for multiple buttons test');
          });
        </script>
      </body>
      </html>
    `);

    // Wait for initialization
    await page.waitForTimeout(2000);

    console.log("Testing multiple todo buttons...");

    // Check if all todo buttons exist
    const todoButtons = page.locator(".todo-float-button");
    await expect(todoButtons).toHaveCount(3);
    console.log("Found 3 todo buttons");

    // Check if modal is initially hidden
    const modal = page.locator("#todo-modal");
    const isInitiallyHidden = await modal.evaluate(
      (el) => el.style.display === "none"
    );
    console.log("Modal initially hidden:", isInitiallyHidden);

    // Test clicking each button
    for (let i = 1; i <= 3; i++) {
      console.log(`Testing button ${i}...`);

      // Reset modal to hidden state first
      await modal.evaluate((el) => (el.style.display = "none"));

      // Click the button
      await page.locator(`#btn${i}`).click();
      await page.waitForTimeout(300);

      // Check if modal is now visible
      const isModalVisible = await modal.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return (
          computedStyle.display !== "none" &&
          computedStyle.visibility !== "hidden"
        );
      });

      console.log(`Modal visible after clicking button ${i}:`, isModalVisible);
      expect(isModalVisible).toBe(true);
    }

    console.log("All todo buttons working correctly!");
  });
});
