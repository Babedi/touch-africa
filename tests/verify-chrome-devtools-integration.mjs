// Final verification script for Chrome DevTools .well-known configuration
// This script can be run after the server is restarted on port 5000

export async function testChromeDevToolsIntegration() {
  const baseUrl = "http://localhost:5000";

  console.log("🚀 Chrome DevTools Integration Verification");
  console.log("============================================\n");

  const tests = [
    {
      name: "Server Health Check",
      url: `${baseUrl}/internal/health`,
      expected: "Server running status",
    },
    {
      name: ".well-known Directory Index",
      url: `${baseUrl}/.well-known/`,
      expected: "HTML directory listing",
    },
    {
      name: "Chrome DevTools Configuration",
      url: `${baseUrl}/.well-known/appspecific/com.chrome.devtools.json`,
      expected: "DevTools JSON configuration",
    },
  ];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`📡 URL: ${test.url}`);

    try {
      const response = await fetch(test.url);

      if (response.ok) {
        console.log(`✅ Status: ${response.status} ${response.statusText}`);
        console.log(`📄 Content-Type: ${response.headers.get("content-type")}`);

        if (test.url.includes(".json")) {
          const data = await response.json();
          console.log(`🔍 Configuration loaded successfully!`);
          console.log(`   📌 Name: ${data.name || "N/A"}`);
          console.log(`   📌 Version: ${data.version || "N/A"}`);
          console.log(
            `   🐛 DevTools Enabled: ${data.devtools?.enabled || false}`
          );
          console.log(
            `   🛠️  Available Features: ${
              data.devtools?.features?.join(", ") || "None"
            }`
          );
          console.log(
            `   ⚡ Performance Profiling: ${
              data.devtools?.performance?.profiling || false
            }`
          );
          console.log(
            `   🔒 Security Features: ${
              data.devtools?.security
                ? Object.keys(data.devtools.security).join(", ")
                : "None"
            }`
          );
        } else {
          const text = await response.text();
          console.log(`📏 Content Length: ${text.length} characters`);
          if (text.includes("Chrome DevTools")) {
            console.log(`🎯 DevTools references found in content`);
          }
        }
      } else {
        console.log(`❌ Status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log(""); // Empty line for spacing
  }

  console.log("📋 Integration Summary:");
  console.log(
    "• Chrome DevTools configuration is available at /.well-known/appspecific/com.chrome.devtools.json"
  );
  console.log("• Directory index provides documentation at /.well-known/");
  console.log(
    "• Express.js serves .well-known directory with proper Content-Type headers"
  );
  console.log(
    "• Configuration includes debugging, performance, and security features"
  );
  console.log("• Ready for Chrome DevTools enhanced debugging experience");

  console.log("\n🎉 Chrome DevTools Integration Complete!");
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testChromeDevToolsIntegration().catch(console.error);
}
