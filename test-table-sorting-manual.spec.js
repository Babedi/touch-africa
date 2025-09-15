import { test, expect } from "@playwright/test";

test.describe("Table Header Sorting Manual Test", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and login
    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/login.html"
    );

    // Fill login form (adjust selectors based on your login form)
    await page.fill(
      'input[name="email"], input[type="email"], #email',
      "admin@touchafrica.com"
    );
    await page.fill(
      'input[name="password"], input[type="password"], #password',
      "password123"
    );

    // Submit login
    await page.click('button[type="submit"], .btn-login, #login-btn');

    // Wait for successful login (adjust based on your redirect)
    await page.waitForURL(/dashboard|admin/, { timeout: 10000 });
  });

  test("People Page - Test All Table Header Sorting", async ({ page }) => {
    console.log("\n=== TESTING PEOPLE PAGE ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/people/people.html"
    );
    await page.waitForSelector("#people-tbody", { timeout: 10000 });

    // Wait for data to load
    await page.waitForFunction(
      () => {
        const tbody = document.querySelector("#people-tbody");
        return tbody && tbody.children.length > 1; // More than just loading row
      },
      { timeout: 15000 }
    );

    const sortableHeaders = [
      { name: "Name", selector: 'th[data-sort="firstName"]' },
      { name: "Email", selector: 'th[data-sort="email"]' },
      { name: "ID Number", selector: 'th[data-sort="idNumber"]' },
      { name: "Gender", selector: 'th[data-sort="gender"]' },
      { name: "Created", selector: 'th[data-sort="audit.createdAt"]' },
    ];

    for (const header of sortableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Test ascending sort (first click)
      console.log(`Clicking ${header.name} header for ascending sort...`);
      await page.click(header.selector);

      // Wait for sort to complete
      await page.waitForTimeout(1000);

      // Capture console logs to verify sorting
      const ascendingLogs = await page.evaluate(() => {
        return window.lastSortLog || "No sort log found";
      });
      console.log(`Ascending sort result: ${ascendingLogs}`);

      // Test descending sort (second click)
      console.log(`Clicking ${header.name} header for descending sort...`);
      await page.click(header.selector);

      // Wait for sort to complete
      await page.waitForTimeout(1000);

      const descendingLogs = await page.evaluate(() => {
        return window.lastSortLog || "No sort log found";
      });
      console.log(`Descending sort result: ${descendingLogs}`);

      // Verify the header is clickable (has cursor pointer)
      const cursorStyle = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return window.getComputedStyle(element).cursor;
      }, header.selector);

      console.log(`${header.name} cursor style: ${cursorStyle}`);
      expect(cursorStyle).toBe("pointer");
    }
  });

  test("Admins Page - Test All Table Header Sorting", async ({ page }) => {
    console.log("\n=== TESTING ADMINS PAGE ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/admins/admins.html"
    );
    await page.waitForSelector("tbody", { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    const sortableHeaders = [
      { name: "Name", selector: 'th[data-sort="personalInfo.firstName"]' },
      { name: "Email", selector: 'th[data-sort="personalInfo.email"]' },
      { name: "Role", selector: 'th[data-sort="role"]' },
      { name: "Status", selector: 'th[data-sort="status"]' },
      { name: "Created", selector: 'th[data-sort="createdAt"]' },
    ];

    for (const header of sortableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Test ascending sort
      console.log(`Clicking ${header.name} header for ascending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Test descending sort
      console.log(`Clicking ${header.name} header for descending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Verify clickable
      const cursorStyle = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element
          ? window.getComputedStyle(element).cursor
          : "element not found";
      }, header.selector);

      console.log(`${header.name} cursor style: ${cursorStyle}`);
    }
  });

  test("Roles Page - Test All Table Header Sorting", async ({ page }) => {
    console.log("\n=== TESTING ROLES PAGE ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/roles/roles.html"
    );
    await page.waitForSelector("tbody", { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    const sortableHeaders = [
      { name: "Role Name", selector: 'th[data-sort="roleName"]' },
      { name: "Description", selector: 'th[data-sort="description"]' },
      { name: "Type", selector: 'th[data-sort="isSystem"]' },
      { name: "Permissions", selector: 'th[data-sort="permissions"]' },
      { name: "Status", selector: 'th[data-sort="isActive"]' },
    ];

    for (const header of sortableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Test ascending sort
      console.log(`Clicking ${header.name} header for ascending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Test descending sort
      console.log(`Clicking ${header.name} header for descending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Verify clickable
      const cursorStyle = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element
          ? window.getComputedStyle(element).cursor
          : "element not found";
      }, header.selector);

      console.log(`${header.name} cursor style: ${cursorStyle}`);
    }
  });

  test("Tenants Page - Test All Table Header Sorting", async ({ page }) => {
    console.log("\n=== TESTING TENANTS PAGE ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/tenants/tenants.html"
    );
    await page.waitForSelector("tbody", { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    const sortableHeaders = [
      { name: "Name", selector: 'th[data-sort="name"]' },
      { name: "Email", selector: 'th[data-sort="email"]' },
      { name: "Phone", selector: 'th[data-sort="phone"]' },
      { name: "Status", selector: 'th[data-sort="status"]' },
      { name: "Created", selector: 'th[data-sort="createdAt"]' },
    ];

    for (const header of sortableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Test ascending sort
      console.log(`Clicking ${header.name} header for ascending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Test descending sort
      console.log(`Clicking ${header.name} header for descending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Verify clickable
      const cursorStyle = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element
          ? window.getComputedStyle(element).cursor
          : "element not found";
      }, header.selector);

      console.log(`${header.name} cursor style: ${cursorStyle}`);
    }
  });

  test("Lookups Page - Test All Table Header Sorting", async ({ page }) => {
    console.log("\n=== TESTING LOOKUPS PAGE ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/lookups/lookups.html"
    );
    await page.waitForSelector("tbody", { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Test main lookups table
    console.log("\n--- Testing Main Lookups Table ---");
    const mainTableHeaders = [
      { name: "Category", selector: 'th[data-sort="category"]' },
      { name: "Sub-Category", selector: 'th[data-sort="subCategory"]' },
      { name: "Items", selector: 'th[data-sort="items"]' },
      { name: "Description", selector: 'th[data-sort="description"]' },
      { name: "Status", selector: 'th[data-sort="status"]' },
    ];

    for (const header of mainTableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Test ascending sort
      console.log(`Clicking ${header.name} header for ascending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Test descending sort
      console.log(`Clicking ${header.name} header for descending sort...`);
      await page.click(header.selector);
      await page.waitForTimeout(1000);

      // Verify clickable
      const cursorStyle = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        return element
          ? window.getComputedStyle(element).cursor
          : "element not found";
      }, header.selector);

      console.log(`${header.name} cursor style: ${cursorStyle}`);
    }
  });

  test("Console Log Verification - Check UnifiedTable Logs", async ({
    page,
  }) => {
    console.log("\n=== TESTING CONSOLE LOGS ===");

    // Capture console logs
    const consoleLogs = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[UnifiedTable]")) {
        consoleLogs.push(msg.text());
        console.log("Console:", msg.text());
      }
    });

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/people/people.html"
    );
    await page.waitForSelector("#people-tbody", { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click a header to generate logs
    await page.click('th[data-sort="firstName"]');
    await page.waitForTimeout(1000);

    await page.click('th[data-sort="firstName"]');
    await page.waitForTimeout(1000);

    console.log(`\nCaptured ${consoleLogs.length} UnifiedTable console logs`);
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

    // Verify we got the expected logs
    const setupLog = consoleLogs.find((log) =>
      log.includes("Setting up sorting for")
    );
    const clickLog = consoleLogs.find((log) => log.includes("Header clicked:"));
    const sortLog = consoleLogs.find((log) => log.includes("Sorting:"));

    console.log("\nLog verification:");
    console.log("Setup log found:", !!setupLog);
    console.log("Click log found:", !!clickLog);
    console.log("Sort log found:", !!sortLog);
  });
});
