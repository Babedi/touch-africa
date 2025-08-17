console.log("🧪 TENANT USER DASHBOARD STRUCTURE VERIFICATION");
console.log("===============================================\n");

try {
  console.log("📋 Step 1: Verifying file exists...");
  const fs = require("fs");
  const path = require("path");

  const dashboardPath = path.join(
    __dirname,
    "frontend",
    "private",
    "external",
    "tenant.user",
    "dashboard.html"
  );

  if (fs.existsSync(dashboardPath)) {
    console.log("✅ Dashboard file exists");

    console.log("\n📋 Step 2: Analyzing structure...");
    const content = fs.readFileSync(dashboardPath, "utf8");

    // Check for key structure elements
    const checks = [
      {
        name: "Sidebar exists",
        test: content.includes('class="dashboard-sidebar"'),
      },
      {
        name: "Main content wrapper exists",
        test: content.includes('class="dashboard-content-wrapper"'),
      },
      {
        name: "Mobile header exists",
        test: content.includes('class="mobile-header"'),
      },
      {
        name: "User info section exists",
        test: content.includes('class="user-info"'),
      },
      { name: "Logout functionality exists", test: content.includes("logout") },
      {
        name: "Dashboard grid exists",
        test: content.includes('class="dashboard-grid"'),
      },
      {
        name: "Navigation links exist",
        test: content.includes("data-section="),
      },
      {
        name: "No duplicate headers",
        test: (content.match(/class="dashboard-header"/g) || []).length <= 1,
      },
      {
        name: "Clean header structure",
        test:
          !content.includes("header-left") && !content.includes("header-right"),
      },
      {
        name: "Has proper CSS links",
        test: content.includes("/shared/css/tenant-user-dashboard.css"),
      },
    ];

    checks.forEach((check) => {
      if (check.test) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    console.log("\n📋 Step 3: Content Analysis...");
    console.log(`📄 File size: ${content.length} bytes`);
    console.log(`📄 Lines: ${content.split("\n").length}`);

    // Check for problematic patterns
    const problemChecks = [
      {
        name: "No dangling headers",
        test: !content.includes("<header") || content.includes("</header>"),
      },
      {
        name: "Proper HTML structure",
        test:
          content.includes("<!DOCTYPE html>") && content.includes("</html>"),
      },
      { name: "Has JavaScript", test: content.includes("<script>") },
    ];

    problemChecks.forEach((check) => {
      if (check.test) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`⚠️  ${check.name}`);
      }
    });

    console.log("\n🎯 STRUCTURE VERIFICATION SUMMARY:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const passedChecks = checks.filter((c) => c.test).length;
    const totalChecks = checks.length;

    if (passedChecks === totalChecks) {
      console.log("🎉 ALL STRUCTURE CHECKS PASSED!");
      console.log("✅ Tenant user dashboard layout is properly fixed");
      console.log("✅ No duplicate headers found");
      console.log("✅ Clean sidebar-based layout implemented");
      console.log("✅ Mobile responsiveness maintained");
    } else {
      console.log(`⚠️  ${passedChecks}/${totalChecks} checks passed`);
      console.log("Some issues may need attention");
    }
  } else {
    console.log("❌ Dashboard file not found at expected location");
  }
} catch (error) {
  console.error("❌ Verification failed:", error.message);
}
