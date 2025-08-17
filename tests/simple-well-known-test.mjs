console.log("Testing .well-known endpoint...");

setTimeout(async () => {
  try {
    // Use fetch instead of http module
    const response = await fetch(
      "http://localhost:5001/.well-known/appspecific/com.chrome.devtools.json"
    );
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Chrome DevTools config loaded successfully!");
      console.log("Version:", data.version);
      console.log("Debug features:", data.debugging?.features?.length || 0);
      console.log("Network features:", data.network?.features?.length || 0);
      console.log(
        "Performance features:",
        data.performance?.features?.length || 0
      );
    } else {
      console.log("❌ Request failed with status:", response.status);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}, 1000);
