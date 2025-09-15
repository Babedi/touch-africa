import { test, expect } from "@playwright/test";

test.describe("Table Header Sorting - Direct Access Test", () => {
  test("People Page - Test All Table Header Sorting (No Login)", async ({
    page,
  }) => {
    console.log("\n=== TESTING PEOPLE PAGE (Direct Access) ===");

    // Capture console logs
    const consoleLogs = [];
    page.on("console", (msg) => {
      if (
        msg.text().includes("[UnifiedTable]") ||
        msg.text().includes("[People]")
      ) {
        consoleLogs.push(msg.text());
        console.log("Console:", msg.text());
      }
    });

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/people/people.html"
    );
    await page.waitForSelector("#people-tbody", { timeout: 10000 });

    // Wait for UnifiedTable to be initialized
    await page.waitForTimeout(2000);

    console.log("\n--- Checking Table Structure ---");

    // Check if table exists and has the correct structure
    const table = await page.$("table");
    const tbody = await page.$("#people-tbody");
    const headers = await page.$$("th[data-sort]");

    console.log(`Table found: ${!!table}`);
    console.log(`Tbody found: ${!!tbody}`);
    console.log(`Sortable headers found: ${headers.length}`);

    const sortableHeaders = [
      { name: "Name", selector: 'th[data-sort="firstName"]' },
      { name: "Email", selector: 'th[data-sort="email"]' },
      { name: "ID Number", selector: 'th[data-sort="idNumber"]' },
      { name: "Gender", selector: 'th[data-sort="gender"]' },
      { name: "Created", selector: 'th[data-sort="audit.createdAt"]' },
    ];

    for (const header of sortableHeaders) {
      console.log(`\n--- Testing ${header.name} header ---`);

      // Check if header exists
      const headerElement = await page.$(header.selector);
      console.log(`${header.name} header exists: ${!!headerElement}`);

      if (headerElement) {
        // Check cursor style
        const cursorStyle = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element
            ? window.getComputedStyle(element).cursor
            : "element not found";
        }, header.selector);
        console.log(`${header.name} cursor style: ${cursorStyle}`);

        // Test clicking the header
        console.log(`Clicking ${header.name} header for ascending sort...`);

        // Wait for any existing network requests to complete
        await page.waitForTimeout(500);

        // Click header and capture any network activity
        const [response] = await Promise.all([
          page
            .waitForResponse(
              (response) =>
                response.url().includes("/api/") ||
                response.url().includes("person"),
              { timeout: 5000 }
            )
            .catch(() => null),
          page.click(header.selector),
        ]);

        if (response) {
          console.log(
            `Network request triggered: ${response.url()} (${response.status()})`
          );
        } else {
          console.log("No network request detected");
        }

        await page.waitForTimeout(1000);

        // Test second click for descending sort
        console.log(`Clicking ${header.name} header for descending sort...`);

        const [response2] = await Promise.all([
          page
            .waitForResponse(
              (response) =>
                response.url().includes("/api/") ||
                response.url().includes("person"),
              { timeout: 5000 }
            )
            .catch(() => null),
          page.click(header.selector),
        ]);

        if (response2) {
          console.log(
            `Network request triggered: ${response2.url()} (${response2.status()})`
          );
        } else {
          console.log("No network request detected");
        }

        await page.waitForTimeout(1000);
      }
    }

    console.log(`\n--- Console Logs Summary ---`);
    console.log(
      `Total UnifiedTable/People logs captured: ${consoleLogs.length}`
    );

    const setupLogs = consoleLogs.filter((log) =>
      log.includes("Setting up sorting")
    );
    const clickLogs = consoleLogs.filter((log) =>
      log.includes("Header clicked")
    );
    const sortLogs = consoleLogs.filter((log) => log.includes("Sorting:"));

    console.log(`Setup logs: ${setupLogs.length}`);
    console.log(`Click logs: ${clickLogs.length}`);
    console.log(`Sort logs: ${sortLogs.length}`);

    if (setupLogs.length > 0) console.log(`Setup: ${setupLogs[0]}`);
    if (clickLogs.length > 0)
      console.log(`Last click: ${clickLogs[clickLogs.length - 1]}`);
    if (sortLogs.length > 0)
      console.log(`Last sort: ${sortLogs[sortLogs.length - 1]}`);
  });

  test("Roles Page - Test All Table Header Sorting (No Login)", async ({
    page,
  }) => {
    console.log("\n=== TESTING ROLES PAGE (Direct Access) ===");

    // Capture console logs
    const consoleLogs = [];
    page.on("console", (msg) => {
      if (
        msg.text().includes("[UnifiedTable]") ||
        msg.text().includes("[Roles]")
      ) {
        consoleLogs.push(msg.text());
        console.log("Console:", msg.text());
      }
    });

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/roles/roles.html"
    );
    await page.waitForSelector("tbody", { timeout: 10000 });

    // Wait for initialization
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

      const headerElement = await page.$(header.selector);
      console.log(`${header.name} header exists: ${!!headerElement}`);

      if (headerElement) {
        const cursorStyle = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          return element
            ? window.getComputedStyle(element).cursor
            : "element not found";
        }, header.selector);
        console.log(`${header.name} cursor style: ${cursorStyle}`);

        // Test clicking
        console.log(`Clicking ${header.name} header...`);
        await page.click(header.selector);
        await page.waitForTimeout(1000);

        await page.click(header.selector);
        await page.waitForTimeout(1000);
      }
    }

    console.log(`\n--- Roles Console Logs Summary ---`);
    console.log(`Total logs captured: ${consoleLogs.length}`);
  });

  test("Quick Check - UnifiedTable Available", async ({ page }) => {
    console.log("\n=== CHECKING UNIFIED TABLE AVAILABILITY ===");

    await page.goto(
      "http://localhost:5000/dashboards/internal.admin/pages/people/people.html"
    );
    await page.waitForTimeout(2000);

    const unifiedTableCheck = await page.evaluate(() => {
      return {
        windowUnifiedTable: typeof window.UnifiedTable,
        setupSorting: window.UnifiedTable
          ? typeof window.UnifiedTable.setupSorting
          : "N/A",
        scriptTags: Array.from(document.querySelectorAll("script"))
          .map((s) => s.src)
          .filter((src) => src.includes("unified-table")),
        headers: Array.from(document.querySelectorAll("th[data-sort]")).length,
        coreUtils: typeof window.TouchAfricaCoreUtils,
      };
    });

    console.log("UnifiedTable availability check:");
    console.log(`window.UnifiedTable: ${unifiedTableCheck.windowUnifiedTable}`);
    console.log(`setupSorting function: ${unifiedTableCheck.setupSorting}`);
    console.log(
      `unified-table scripts: ${unifiedTableCheck.scriptTags.length}`
    );
    console.log(`sortable headers: ${unifiedTableCheck.headers}`);
    console.log(`CoreUtils: ${unifiedTableCheck.coreUtils}`);

    if (unifiedTableCheck.scriptTags.length > 0) {
      console.log(`Script sources: ${unifiedTableCheck.scriptTags.join(", ")}`);
    }
  });
});
