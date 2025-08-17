#!/usr/bin/env node

/**
 * Comprehensive Lookups Module Test Suite
 * Tests all aspects of the lookups module including CRUD, validation, bulk operations, and edge cases
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "http://localhost:5000/internal/lookups";
const TOKEN_FILE = join(__dirname, "..", "token.txt");

// Test statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Test results storage
let testResults = [];

// Helper functions
function getAuthToken() {
  try {
    return readFileSync(TOKEN_FILE, "utf8").trim();
  } catch (error) {
    return null;
  }
}

async function makeRequest(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();
  return { status: response.status, data, headers: response.headers };
}

function loadPayload(filename) {
  const payloadPath = join(__dirname, "payloads", filename);
  try {
    const content = readFileSync(payloadPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to load payload ${filename}:`, error.message);
    return null;
  }
}

function logTest(name, status, message = "", details = null) {
  testStats.total++;

  if (status === "PASS") {
    testStats.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else if (status === "FAIL") {
    testStats.failed++;
    console.log(`❌ ${name}: ${message}`);
    if (details) console.log(`   Details:`, details);
  } else if (status === "SKIP") {
    testStats.skipped++;
    console.log(`⏭️ ${name}: ${message}`);
  }

  testResults.push({
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString(),
  });
}

// Core CRUD Tests
class LookupsCRUDTests {
  constructor() {
    this.createdIds = [];
  }

  async testCreateValidLookup() {
    console.log("\n📝 CRUD Tests - Create Operations");

    try {
      const payload = loadPayload("lookups.min.json");
      if (!payload) {
        logTest("Create Valid Lookup", "SKIP", "Payload not available");
        return;
      }

      // Make category unique
      payload.category = `Test_${Date.now()}`;

      const { status, data } = await makeRequest(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (status === 201 && data.success && data.data.id) {
        this.createdIds.push(data.data.id);
        logTest(
          "Create Valid Lookup",
          "PASS",
          `Created with ID: ${data.data.id}`
        );
        return data.data.id;
      } else {
        logTest("Create Valid Lookup", "FAIL", "Invalid response", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Create Valid Lookup", "FAIL", error.message);
    }
    return null;
  }

  async testCreateDuplicateLookup() {
    try {
      const payload = loadPayload("lookups.min.json");
      if (!payload) {
        logTest("Create Duplicate Lookup", "SKIP", "Payload not available");
        return;
      }

      // Create first lookup
      payload.category = `Duplicate_${Date.now()}`;
      const { status: status1, data: data1 } = await makeRequest(
        `${BASE_URL}`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (status1 === 201 && data1.success) {
        this.createdIds.push(data1.data.id);

        // Try to create duplicate
        const { status: status2, data: data2 } = await makeRequest(
          `${BASE_URL}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        if (
          status2 === 409 &&
          !data2.success &&
          data2.error.includes("already exists")
        ) {
          logTest(
            "Create Duplicate Lookup",
            "PASS",
            "Correctly rejected duplicate"
          );
        } else {
          logTest(
            "Create Duplicate Lookup",
            "FAIL",
            "Should have rejected duplicate",
            { status: status2, data: data2 }
          );
        }
      } else {
        logTest(
          "Create Duplicate Lookup",
          "SKIP",
          "Could not create initial lookup"
        );
      }
    } catch (error) {
      logTest("Create Duplicate Lookup", "FAIL", error.message);
    }
  }

  async testCreateInvalidLookup() {
    try {
      const payload = loadPayload("lookups.invalid.json");
      if (!payload) {
        logTest("Create Invalid Lookup", "SKIP", "Payload not available");
        return;
      }

      const { status, data } = await makeRequest(`${BASE_URL}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (status === 400 && !data.success && data.details) {
        logTest(
          "Create Invalid Lookup",
          "PASS",
          `Validation errors detected: ${data.details.length} errors`
        );
      } else {
        logTest(
          "Create Invalid Lookup",
          "FAIL",
          "Should have returned validation errors",
          { status, data }
        );
      }
    } catch (error) {
      logTest("Create Invalid Lookup", "FAIL", error.message);
    }
  }

  async testGetLookupsList() {
    console.log("\n📋 CRUD Tests - Read Operations");

    try {
      const { status, data } = await makeRequest(
        `${BASE_URL}/list?limit=10&offset=0`
      );

      if (
        status === 200 &&
        data.success &&
        data.data.lookups &&
        data.data.pagination
      ) {
        logTest(
          "Get Lookups List",
          "PASS",
          `Retrieved ${data.data.lookups.length} lookups, total: ${data.data.pagination.total}`
        );
      } else {
        logTest("Get Lookups List", "FAIL", "Invalid response format", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Get Lookups List", "FAIL", error.message);
    }
  }

  async testGetLookupById(id) {
    try {
      if (!id) {
        logTest("Get Lookup By ID", "SKIP", "No ID available");
        return;
      }

      const { status, data } = await makeRequest(`${BASE_URL}/${id}`);

      if (status === 200 && data.success && data.data.id === id) {
        logTest(
          "Get Lookup By ID",
          "PASS",
          `Retrieved lookup: ${data.data.category}/${data.data.subCategory}`
        );
      } else {
        logTest("Get Lookup By ID", "FAIL", "Invalid response", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Get Lookup By ID", "FAIL", error.message);
    }
  }

  async testGetNonExistentLookup() {
    try {
      const fakeId = "LOOKUP999999999999";
      const { status, data } = await makeRequest(`${BASE_URL}/${fakeId}`);

      if (
        status === 404 &&
        !data.success &&
        data.error === "Lookup not found"
      ) {
        logTest(
          "Get Non-Existent Lookup",
          "PASS",
          "Correctly returned 404 for non-existent lookup"
        );
      } else {
        logTest("Get Non-Existent Lookup", "FAIL", "Should have returned 404", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Get Non-Existent Lookup", "FAIL", error.message);
    }
  }

  async testUpdateLookup(id) {
    console.log("\n✏️ CRUD Tests - Update Operations");

    try {
      if (!id) {
        logTest("Update Lookup", "SKIP", "No ID available");
        return;
      }

      const updateData = {
        description: `Updated at ${new Date().toISOString()}`,
        items: ["Item1", "Item2", "Item3", "UpdatedItem"],
        metadata: {
          tags: ["updated", "test"],
          sortOrder: 100,
        },
      };

      const { status, data } = await makeRequest(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (status === 200 && data.success && data.data.version > 1) {
        logTest(
          "Update Lookup",
          "PASS",
          `Updated to version ${data.data.version}`
        );
      } else {
        logTest("Update Lookup", "FAIL", "Update failed", { status, data });
      }
    } catch (error) {
      logTest("Update Lookup", "FAIL", error.message);
    }
  }

  async testUpdateNonExistentLookup() {
    try {
      const fakeId = "LOOKUP999999999999";
      const updateData = { description: "This should fail" };

      const { status, data } = await makeRequest(`${BASE_URL}/${fakeId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (status === 404 && !data.success) {
        logTest("Update Non-Existent Lookup", "PASS", "Correctly returned 404");
      } else {
        logTest(
          "Update Non-Existent Lookup",
          "FAIL",
          "Should have returned 404",
          { status, data }
        );
      }
    } catch (error) {
      logTest("Update Non-Existent Lookup", "FAIL", error.message);
    }
  }

  async testDeleteLookup(id) {
    console.log("\n🗑️ CRUD Tests - Delete Operations");

    try {
      if (!id) {
        logTest("Delete Lookup", "SKIP", "No ID available");
        return;
      }

      const { status, data } = await makeRequest(`${BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (status === 200 && data.success && data.data.id === id) {
        logTest("Delete Lookup", "PASS", `Deleted lookup: ${id}`);
        // Remove from our tracking array
        this.createdIds = this.createdIds.filter(
          (createdId) => createdId !== id
        );
      } else {
        logTest("Delete Lookup", "FAIL", "Delete failed", { status, data });
      }
    } catch (error) {
      logTest("Delete Lookup", "FAIL", error.message);
    }
  }

  async testDeleteNonExistentLookup() {
    try {
      const fakeId = "LOOKUP999999999999";
      const { status, data } = await makeRequest(`${BASE_URL}/${fakeId}`, {
        method: "DELETE",
      });

      if (status === 404 && !data.success) {
        logTest("Delete Non-Existent Lookup", "PASS", "Correctly returned 404");
      } else {
        logTest(
          "Delete Non-Existent Lookup",
          "FAIL",
          "Should have returned 404",
          { status, data }
        );
      }
    } catch (error) {
      logTest("Delete Non-Existent Lookup", "FAIL", error.message);
    }
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up test data...");
    for (const id of this.createdIds) {
      try {
        await makeRequest(`${BASE_URL}/${id}`, { method: "DELETE" });
        console.log(`   Cleaned up: ${id}`);
      } catch (error) {
        console.log(`   Failed to cleanup: ${id}`);
      }
    }
  }
}

// Search and Filter Tests
class LookupsSearchTests {
  async testBasicSearch() {
    console.log("\n🔍 Search and Filter Tests");

    try {
      const { status, data } = await makeRequest(
        `${BASE_URL}/search?query=geography&limit=5`
      );

      if (
        status === 200 &&
        data.success &&
        data.data.lookups &&
        data.data.query
      ) {
        logTest(
          "Basic Search",
          "PASS",
          `Found ${data.data.lookups.length} results for "${data.data.query}"`
        );
      } else {
        logTest("Basic Search", "FAIL", "Search failed", { status, data });
      }
    } catch (error) {
      logTest("Basic Search", "FAIL", error.message);
    }
  }

  async testSearchWithFilters() {
    try {
      const { status, data } = await makeRequest(
        `${BASE_URL}/search?query=test&category=Geography&isActive=true&limit=3`
      );

      if (status === 200 && data.success) {
        logTest(
          "Search With Filters",
          "PASS",
          `Search with filters returned ${data.data.lookups.length} results`
        );
      } else {
        logTest("Search With Filters", "FAIL", "Filtered search failed", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Search With Filters", "FAIL", error.message);
    }
  }

  async testEmptySearch() {
    try {
      const { status, data } = await makeRequest(
        `${BASE_URL}/search?query=xyz123nonexistent&limit=5`
      );

      if (status === 200 && data.success && data.data.lookups.length === 0) {
        logTest(
          "Empty Search Results",
          "PASS",
          "Correctly returned no results for non-existent query"
        );
      } else {
        logTest(
          "Empty Search Results",
          "FAIL",
          "Should have returned empty results",
          { status, data }
        );
      }
    } catch (error) {
      logTest("Empty Search Results", "FAIL", error.message);
    }
  }

  async testAdvancedFilter() {
    try {
      const filterPayload = {
        categories: ["Geography"],
        isActive: true,
        limit: 10,
        sortBy: "category",
        sortOrder: "asc",
      };

      const { status, data } = await makeRequest(`${BASE_URL}/filter`, {
        method: "POST",
        body: JSON.stringify(filterPayload),
      });

      if (status === 200 && data.success) {
        logTest(
          "Advanced Filter",
          "PASS",
          `Filter returned ${data.data.lookups.length} results`
        );
      } else {
        logTest("Advanced Filter", "FAIL", "Advanced filter failed", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Advanced Filter", "FAIL", error.message);
    }
  }
}

// Bulk Operations Tests
class LookupsBulkTests {
  async testBulkCreate() {
    console.log("\n📦 Bulk Operations Tests");

    try {
      const payload = loadPayload("lookups.bulk-create.json");
      if (!payload) {
        logTest("Bulk Create", "SKIP", "Payload not available");
        return;
      }

      // Make categories unique
      payload.forEach((item, index) => {
        item.category = `BulkTest_${Date.now()}_${index}`;
      });

      const { status, data } = await makeRequest(`${BASE_URL}/bulk`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (
        (status === 201 || status === 207) &&
        data.success &&
        data.data.summary
      ) {
        logTest(
          "Bulk Create",
          "PASS",
          `Created: ${data.data.summary.successful}/${data.data.summary.total}, Errors: ${data.data.summary.failed}`
        );

        // Store IDs for cleanup
        if (data.data.created) {
          this.createdIds = data.data.created.map((item) => item.id);
        }
      } else {
        logTest("Bulk Create", "FAIL", "Bulk create failed", { status, data });
      }
    } catch (error) {
      logTest("Bulk Create", "FAIL", error.message);
    }
  }

  async testBulkCreateValidation() {
    try {
      const invalidPayload = [
        { category: "", subCategory: "", items: [] }, // Invalid
        { category: "Valid", subCategory: "Valid", items: ["Item1"] }, // Valid
      ];

      const { status, data } = await makeRequest(`${BASE_URL}/bulk`, {
        method: "POST",
        body: JSON.stringify(invalidPayload),
      });

      if (status === 207 && data.success && data.data.errors.length > 0) {
        logTest(
          "Bulk Create Validation",
          "PASS",
          "Correctly handled mixed valid/invalid data"
        );
      } else {
        logTest(
          "Bulk Create Validation",
          "FAIL",
          "Should have handled validation errors",
          { status, data }
        );
      }
    } catch (error) {
      logTest("Bulk Create Validation", "FAIL", error.message);
    }
  }
}

// Utility Tests
class LookupsUtilityTests {
  async testGetCategories() {
    console.log("\n🔧 Utility Tests");

    try {
      const { status, data } = await makeRequest(`${BASE_URL}/categories`);

      if (status === 200 && data.success && Array.isArray(data.data)) {
        logTest(
          "Get Categories",
          "PASS",
          `Retrieved ${data.data.length} categories`
        );
      } else {
        logTest("Get Categories", "FAIL", "Failed to get categories", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Get Categories", "FAIL", error.message);
    }
  }

  async testGetSubCategories() {
    try {
      // First get categories to find a valid one
      const { status: catStatus, data: catData } = await makeRequest(
        `${BASE_URL}/categories`
      );

      if (catStatus === 200 && catData.success && catData.data.length > 0) {
        const category = catData.data[0];
        const { status, data } = await makeRequest(
          `${BASE_URL}/categories/${encodeURIComponent(category)}/subcategories`
        );

        if (status === 200 && data.success && Array.isArray(data.data)) {
          logTest(
            "Get Sub-Categories",
            "PASS",
            `Retrieved ${data.data.length} sub-categories for "${category}"`
          );
        } else {
          logTest(
            "Get Sub-Categories",
            "FAIL",
            "Failed to get sub-categories",
            { status, data }
          );
        }
      } else {
        logTest(
          "Get Sub-Categories",
          "SKIP",
          "No categories available for testing"
        );
      }
    } catch (error) {
      logTest("Get Sub-Categories", "FAIL", error.message);
    }
  }

  async testHealthCheck() {
    try {
      const { status, data } = await makeRequest(`${BASE_URL}/health`);

      if (
        status === 200 &&
        data.success &&
        data.data.service === "lookups" &&
        data.data.status === "healthy"
      ) {
        logTest("Health Check", "PASS", "Service is healthy");
      } else {
        logTest("Health Check", "FAIL", "Health check failed", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Health Check", "FAIL", error.message);
    }
  }
}

// Performance Tests
class LookupsPerformanceTests {
  async testLargeDatasetPagination() {
    console.log("\n⚡ Performance Tests");

    try {
      const startTime = Date.now();
      const { status, data } = await makeRequest(
        `${BASE_URL}/list?limit=100&offset=0`
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (status === 200 && data.success) {
        if (duration < 2000) {
          // 2 seconds threshold
          logTest(
            "Large Dataset Pagination",
            "PASS",
            `Retrieved ${data.data.lookups.length} records in ${duration}ms`
          );
        } else {
          logTest(
            "Large Dataset Pagination",
            "FAIL",
            `Too slow: ${duration}ms (threshold: 2000ms)`
          );
        }
      } else {
        logTest("Large Dataset Pagination", "FAIL", "Request failed", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Large Dataset Pagination", "FAIL", error.message);
    }
  }

  async testSearchPerformance() {
    try {
      const startTime = Date.now();
      const { status, data } = await makeRequest(
        `${BASE_URL}/search?query=test&limit=50`
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (status === 200 && data.success) {
        if (duration < 1500) {
          // 1.5 seconds threshold
          logTest(
            "Search Performance",
            "PASS",
            `Search completed in ${duration}ms`
          );
        } else {
          logTest(
            "Search Performance",
            "FAIL",
            `Too slow: ${duration}ms (threshold: 1500ms)`
          );
        }
      } else {
        logTest("Search Performance", "FAIL", "Search failed", {
          status,
          data,
        });
      }
    } catch (error) {
      logTest("Search Performance", "FAIL", error.message);
    }
  }
}

// Main test suite runner
async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive Lookups Module Tests");
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log(`🔑 Token: ${getAuthToken() ? "Available" : "Not available"}`);
  console.log(`📅 Started: ${new Date().toISOString()}\n`);

  // Initialize test classes
  const crudTests = new LookupsCRUDTests();
  const searchTests = new LookupsSearchTests();
  const bulkTests = new LookupsBulkTests();
  const utilityTests = new LookupsUtilityTests();
  const performanceTests = new LookupsPerformanceTests();

  let primaryId = null;

  try {
    // Run all test suites
    await utilityTests.testHealthCheck();

    // CRUD Tests
    primaryId = await crudTests.testCreateValidLookup();
    await crudTests.testCreateDuplicateLookup();
    await crudTests.testCreateInvalidLookup();
    await crudTests.testGetLookupsList();
    await crudTests.testGetLookupById(primaryId);
    await crudTests.testGetNonExistentLookup();
    await crudTests.testUpdateLookup(primaryId);
    await crudTests.testUpdateNonExistentLookup();
    await crudTests.testDeleteNonExistentLookup();
    // Note: We'll delete primaryId at the very end

    // Search and Filter Tests
    await searchTests.testBasicSearch();
    await searchTests.testSearchWithFilters();
    await searchTests.testEmptySearch();
    await searchTests.testAdvancedFilter();

    // Bulk Operations Tests
    await bulkTests.testBulkCreate();
    await bulkTests.testBulkCreateValidation();

    // Utility Tests
    await utilityTests.testGetCategories();
    await utilityTests.testGetSubCategories();

    // Performance Tests
    await performanceTests.testLargeDatasetPagination();
    await performanceTests.testSearchPerformance();

    // Final cleanup
    await crudTests.testDeleteLookup(primaryId);
    await crudTests.cleanup();
  } catch (error) {
    console.error("\n💥 Test suite error:", error);
  }

  // Print test summary
  console.log("\n📊 Test Summary");
  console.log("================");
  console.log(`Total Tests: ${testStats.total}`);
  console.log(`✅ Passed: ${testStats.passed}`);
  console.log(`❌ Failed: ${testStats.failed}`);
  console.log(`⏭️ Skipped: ${testStats.skipped}`);
  console.log(
    `📈 Success Rate: ${
      testStats.total > 0
        ? Math.round((testStats.passed / testStats.total) * 100)
        : 0
    }%`
  );
  console.log(`⏱️ Completed: ${new Date().toISOString()}`);

  // Print failed tests details
  if (testStats.failed > 0) {
    console.log("\n❌ Failed Tests Details:");
    testResults
      .filter((result) => result.status === "FAIL")
      .forEach((result) => {
        console.log(`   - ${result.name}: ${result.message}`);
      });
  }

  console.log("\n🎯 Test Categories Covered:");
  console.log("   ✓ CRUD Operations (Create, Read, Update, Delete)");
  console.log("   ✓ Validation and Error Handling");
  console.log("   ✓ Search and Filtering");
  console.log("   ✓ Bulk Operations");
  console.log("   ✓ Utility Functions");
  console.log("   ✓ Performance Testing");
  console.log("   ✓ Edge Cases and Error Scenarios");

  return testStats;
}

// Export for use in other tests
export {
  runComprehensiveTests,
  LookupsCRUDTests,
  LookupsSearchTests,
  LookupsBulkTests,
  LookupsUtilityTests,
  LookupsPerformanceTests,
};

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().catch(console.error);
}
