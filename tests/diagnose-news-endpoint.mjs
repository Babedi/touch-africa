import express from "express";

const diagnosisApp = express();

// Test the news endpoint directly
diagnosisApp.get("/general/serviceInfo/news", async (req, res) => {
  console.log("🔍 Starting news endpoint diagnosis...");

  try {
    console.log("Step 1: Testing basic response");
    res.json({
      success: true,
      message: "Basic endpoint working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Basic test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

diagnosisApp.listen(3001, () => {
  console.log("🔬 Diagnosis server running on port 3001");
  console.log("🔗 Test: http://localhost:3001/general/serviceInfo/news");
});
