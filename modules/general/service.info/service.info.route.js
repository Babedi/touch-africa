import express from "express";
import { authenticateJWT } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/authorize.middleware.js";
import {
  getServiceInfoHandler,
  updateServiceInfoHandler,
  writeRoles,
} from "./service.info.controller.js";

const router = express.Router();

router.get("/general/serviceInfo", getServiceInfoHandler);
router.put(
  "/general/serviceInfo",
  (req, res, next) => {
    console.log("🔍 Service Info Route - Before auth middleware");
    console.log("  Body type:", typeof req.body);
    console.log("  Body keys:", Object.keys(req.body || {}));
    console.log("  Headers:", req.headers);
    next();
  },
  authenticateJWT,
  (req, res, next) => {
    console.log("🔍 Service Info Route - After auth, before authorize");
    next();
  },
  authorize(...writeRoles),
  (req, res, next) => {
    console.log("🔍 Service Info Route - After authorize, before controller");
    next();
  },
  updateServiceInfoHandler
);

router.get("/general/serviceInfo/ping", (_req, res) => res.json({ ok: true }));

// PUBLIC ENDPOINT: Get news from Firebase
// Uses Firebase path: /services/neighbourGuardService/news
// Returns array of news items with title, content, date, priority
router.get("/general/serviceInfo/news", async (req, res) => {
  try {
    console.log(
      "📰 Loading news from Firebase path: /services/neighbourGuardService/news"
    );

    // Import Firestore client directly
    const { db } = await import("../../../services/firestore.client.js");

    // Access the Firebase path: /services/neighbourGuardService/news
    const newsCollection = db
      .collection("services")
      .doc("neighbourGuardService")
      .collection("news");

    // Get news items (without composite index requirement)
    // Note: Removed .where() and .orderBy() to avoid composite index requirement
    // Filter and sort in memory instead
    const snapshot = await newsCollection.limit(50).get();

    console.log(`📊 Retrieved ${snapshot.size} news items`);

    if (snapshot.empty) {
      console.log("⚠️  No news items found - returning sample data for demo");

      // Return sample news data for demonstration
      const sampleNews = [
        {
          id: "SAMPLE_001",
          title: "🚨 Welcome to NeighbourGuard™ News System",
          content: "Real-time news and updates from your security platform",
          publishedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
          priority: "high",
          category: "system",
          isActive: true,
          author: "NeighbourGuard™ System",
          url: null,
        },
        {
          id: "SAMPLE_002",
          title: "📱 System Status: All Services Operational",
          content: "All emergency response systems are functioning normally",
          publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
          priority: "normal",
          category: "status",
          isActive: true,
          author: "Operations Team",
          url: null,
        },
        {
          id: "SAMPLE_003",
          title: "🔧 Scheduled Maintenance: October 20, 2025",
          content: "Brief maintenance window scheduled for system upgrades",
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          priority: "normal",
          category: "maintenance",
          isActive: true,
          author: "Technical Team",
          url: null,
        },
      ];

      return res.json({
        success: true,
        data: sampleNews,
        meta: {
          total: sampleNews.length,
          lastUpdated: new Date().toISOString(),
          source: "sample_data",
        },
      });
    }

    // Extract news data from each document
    const newsItems = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Filter for active items only (since we can't use .where() without index)
      if (data.isActive !== true) {
        return; // Skip inactive items
      }

      console.log(`📰 News item ${doc.id}:`, {
        title: data.title,
        priority: data.priority,
        publishedAt: data.publishedAt,
      });

      newsItems.push({
        id: doc.id,
        title: data.title || "Untitled News",
        content: data.content || "",
        publishedAt: data.publishedAt || new Date().toISOString(),
        priority: data.priority || "normal", // high, normal, low
        category: data.category || "general",
        isActive: data.isActive !== false,
        expiresAt: data.expiresAt || null,
        url: data.url || null,
        author: data.author || "NeighbourGuard™",
      });
    });

    // Sort by publishedAt in memory (newest first)
    newsItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Limit to 20 most recent items
    const limitedNews = newsItems.slice(0, 20);

    console.log(`📋 Returning ${limitedNews.length} active news items`);

    res.json({
      success: true,
      data: limitedNews,
      meta: {
        total: limitedNews.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error loading news from Firebase:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load news",
      message: error.message,
    });
  }
});

// PUBLIC ENDPOINT: Get tenant activation response block names
// Uses Firebase path: /services/neighbourGuardService/tenants
// Returns array of activationResponseBlockName values
router.get("/general/tenants", async (req, res) => {
  try {
    console.log(
      "🏘️ Loading tenants from Firebase path: /services/neighbourGuardService/tenants"
    );

    // Import Firestore client directly
    const { db } = await import("../../../services/firestore.client.js");

    // Access the exact Firebase path specified: /services/neighbourGuardService/tenants
    const tenantsCollection = db
      .collection("services")
      .doc("neighbourGuardService")
      .collection("tenants");

    const snapshot = await tenantsCollection.get();
    console.log(`📊 Retrieved ${snapshot.size} tenant documents`);

    if (snapshot.empty) {
      console.log("⚠️  No tenant documents found");
      return res.json({ success: true, data: [] });
    }

    // Extract activationResponseBlockName from each document
    const tenantNames = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const blockName = data.activationResponseBlockName;

      console.log(
        `� Document ${doc.id}: activationResponseBlockName = "${blockName}"`
      );

      if (blockName && typeof blockName === "string" && blockName.trim()) {
        tenantNames.push(blockName.trim());
      }
    });

    // Return unique sorted list
    const uniqueTenantNames = [...new Set(tenantNames)].sort();
    console.log(
      `📋 Returning ${uniqueTenantNames.length} unique tenant names:`,
      uniqueTenantNames
    );

    res.json({
      success: true,
      data: uniqueTenantNames, // Simple string array for dropdown
    });
  } catch (error) {
    console.error("❌ Error loading tenants from Firebase:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load tenants",
      message: error.message,
    });
  }
});

// PUBLIC ENDPOINT: Get features from Firebase
// Uses Firebase path: /services/neighbourGuardService
// Returns features array with title and text from the serviceInfo document
router.get("/general/serviceInfo/features", async (req, res) => {
  try {
    console.log(
      "🔧 Loading features from Firebase path: /services/neighbourGuardService"
    );

    // Import Firestore client directly
    const { db } = await import("../../../services/firestore.client.js");

    // Access the Firebase path: /services/neighbourGuardService
    const serviceDoc = db.collection("services").doc("neighbourGuardService");

    const snapshot = await serviceDoc.get();

    if (!snapshot.exists) {
      console.log("⚠️  Service document not found - returning sample data");

      // Return sample features data for demonstration
      const sampleFeatures = [
        {
          title: "Advanced Emergency Response",
          text: "Multi-tier alarm management with instant notifications to internal and external responders",
        },
        {
          title: "Tenant Management Portal",
          text: "Comprehensive administration dashboard for managing residents, responders, and emergency protocols",
        },
        {
          title: "Real-time Status Monitoring",
          text: "Live tracking of all alarm systems, response teams, and emergency activations across your community",
        },
      ];

      return res.json({
        success: true,
        data: sampleFeatures,
        meta: {
          total: sampleFeatures.length,
          lastUpdated: new Date().toISOString(),
          source: "sample_data",
        },
      });
    }

    const data = snapshot.data();
    const features = data.features || [];

    console.log(
      `📊 Retrieved ${features.length} features from service document`
    );

    // Ensure each feature has title and text properties
    const formattedFeatures = features.map((feature, index) => ({
      title: feature.title || `Feature ${index + 1}`,
      text: feature.text || "No description available",
    }));

    console.log(`📋 Returning ${formattedFeatures.length} formatted features`);

    res.json({
      success: true,
      data: formattedFeatures,
      meta: {
        total: formattedFeatures.length,
        lastUpdated: new Date().toISOString(),
        source: "firestore_document",
      },
    });
  } catch (error) {
    console.error("❌ Error loading features from Firebase:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load features",
      message: error.message,
    });
  }
});

export default router;
