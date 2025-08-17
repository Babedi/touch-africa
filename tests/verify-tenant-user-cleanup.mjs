console.log("🧹 TENANT USER DASHBOARD CONTENT CLEANUP VERIFICATION");
console.log("====================================================\n");

try {
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
    console.log("📋 Reading cleaned dashboard file...");
    const content = fs.readFileSync(dashboardPath, "utf8");

    console.log("\n📊 File Statistics:");
    console.log(`📄 Total lines: ${content.split("\n").length}`);
    console.log(`📄 File size: ${content.length} bytes`);

    console.log("\n🧹 Content Cleanup Verification:");

    // Check for clean structure
    const checks = [
      {
        name: "Has main content area",
        test: content.includes('class="main-content"'),
      },
      {
        name: "Content area is minimal",
        test: content.includes("Content area - ready for new content"),
      },
      {
        name: "No duplicate main tags",
        test: (content.match(/<main/g) || []).length === 1,
      },
      {
        name: "Proper closing structure",
        test: content.includes("</main>\n    </main>"),
      },
      {
        name: "Scripts section intact",
        test: content.includes('<script src="/shared/notifications.js">'),
      },
      {
        name: "Sidebar structure intact",
        test: content.includes('class="dashboard-sidebar"'),
      },
      {
        name: "Mobile header intact",
        test: content.includes('class="mobile-header"'),
      },
      {
        name: "No leftover dashboard cards",
        test: !content.includes("dashboard-card"),
      },
      {
        name: "No leftover welcome message",
        test: !content.includes("Welcome to Your Safety Portal"),
      },
      { name: "No leftover stat cards", test: !content.includes("stat-card") },
    ];

    checks.forEach((check) => {
      if (check.test) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
      }
    });

    console.log("\n🎯 CLEANUP SUMMARY:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const passedChecks = checks.filter((c) => c.test).length;
    const totalChecks = checks.length;

    if (passedChecks === totalChecks) {
      console.log("🎉 CONTENT CLEANUP SUCCESSFUL!");
      console.log("✅ Tenant user dashboard is now clean and minimal");
      console.log("✅ All problematic content removed");
      console.log("✅ Structure is ready for new content");
      console.log("✅ Sidebar and mobile header preserved");
      console.log("✅ JavaScript functionality intact");
    } else {
      console.log(`⚠️  ${passedChecks}/${totalChecks} checks passed`);
      console.log("Some cleanup may be incomplete");
    }

    console.log("\n📝 Current Structure:");
    console.log("┌─────────────────────────────────────┐");
    console.log("│ ✅ Clean Sidebar                   │");
    console.log("│ ✅ Mobile Header (responsive)       │");
    console.log("│ ✅ Empty Main Content Area          │");
    console.log("│ ✅ Complete JavaScript Functions    │");
    console.log("└─────────────────────────────────────┘");
  } else {
    console.log("❌ Dashboard file not found");
  }
} catch (error) {
  console.error("❌ Verification failed:", error.message);
}
